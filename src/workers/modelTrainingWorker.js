import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _globalCtx = null;
let _model = null;

const WEIGHTS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1,
};

// --- UTILITÁRIOS ---

const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

const oneHotWeighted = (index, length, weight) =>
    tf.oneHot(index, length).cast('float32').mul(weight);

// --- LÓGICA DE PROCESSAMENTO ---

function makeContext(products, users) {
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];

    const colorsIndex = Object.fromEntries(colors.map((color, index) => [color, index]));
    const categoriesIndex = Object.fromEntries(categories.map((category, index) => [category, index]));

    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.purchases.forEach(p => {
            ageSums[p.name] = (ageSums[p.name] || 0) + user.age;
            ageCounts[p.name] = (ageCounts[p.name] || 0) + 1;
        });
    });

    const productAvgAgeNorm = Object.fromEntries(
        products.map(product => {
            const avg = ageCounts[product.name] ? ageSums[product.name] / ageCounts[product.name] : midAge;
            return [product.name, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        products,
        users,
        colors,
        categories,
        colorsIndex,
        categoriesIndex,
        productAvgAgeNorm,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        dimentions: 2 + categories.length + colors.length
    };
}

function encodeProduct(product, context) {
    return tf.tidy(() => {
        const price = tf.tensor1d([normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price]);
        const age = tf.tensor1d([(context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age]);
        const category = oneHotWeighted(context.categoriesIndex[product.category], context.numCategories, WEIGHTS.category);
        const color = oneHotWeighted(context.colorsIndex[product.color], context.numColors, WEIGHTS.color);

        return tf.concat1d([price, age, category, color]);
    });
}

function encodeUser(user, context) {
    return tf.tidy(() => {
        if (user.purchases && user.purchases.length > 0) {
            const productVectors = user.purchases.map(p => encodeProduct(p, context));
            return tf.stack(productVectors).mean(0).reshape([1, context.dimentions]);
        }

        const userAge = user.age || 25;
        const ageNormalized = normalize(userAge, context.minAge, context.maxAge);
        const ageTensor = tf.tensor1d([ageNormalized * WEIGHTS.age]);
        
        const priceZero = tf.zeros([1]);
        const categoriesZero = tf.zeros([context.numCategories]);
        const colorsZero = tf.zeros([context.numColors]);

        return tf.concat1d([priceZero, ageTensor, categoriesZero, colorsZero]).reshape([1, context.dimentions]);
    });
}

// --- TREINAMENTO ---

async function configureNeuralNetAndTrain(trainingData) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainingData.inputDimention], units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainingData.xs, trainingData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({ type: workerEvents.trainingLog, epoch, loss: logs.loss, accuracy: logs.acc });
            }
        }
    });

    return model;
}

async function trainModel({ users }) {
    console.log('🚀 Iniciando treinamento...');
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });

    const products = await (await fetch('/data/products.json')).json();
    const context = makeContext(products, users);

    context.productVectors = products.map(product => ({
        name: product.name,
        meta: { ...product },
        vector: Array.from(encodeProduct(product, context).dataSync())
    }));

    const inputs = [];
    const labels = [];

    context.users.filter(u => u.purchases.length).forEach(user => {
        const userVector = encodeUser(user, context).dataSync();
        context.products.forEach(product => {
            const productVector = encodeProduct(product, context).dataSync();
            const label = user.purchases.some(p => p.name === product.name) ? 1 : 0;
            inputs.push([...userVector, ...productVector]);
            labels.push(label);
        });
    });

    const trainData = {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimention: context.dimentions * 2
    };

    _model = await configureNeuralNetAndTrain(trainData);
    _globalCtx = context;

    // --- SALVAMENTO ---
    await _model.save(tf.io.withSaveHandler(async (artifacts) => {
        const weightData = btoa(String.fromCharCode(...new Uint8Array(artifacts.weightData)));
        await fetch('http://localhost:3001/api/model/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                modelName: 'recomendacao-v1',
                modelTopology: artifacts.modelTopology,
                weightSpecs: artifacts.weightSpecs,
                weightData: weightData
            })
        });
        return { modelArtifacts: artifacts };
    }));

    await fetch('http://localhost:3001/api/context/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            minPrice: context.minPrice, maxPrice: context.maxPrice,
            minAge: context.minAge, maxAge: context.maxAge,
            categories: context.categories, colors: context.colors,
            productAvgAgeNorm: context.productAvgAgeNorm
        })
    });

    console.log('✅ Treino e Sincronização Concluídos!');
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

// --- CARREGAMENTO E RECOMENDAÇÃO ---

async function loadExistingModel() {
    try {
        const API_URL = 'http://localhost:3001';
        
        // Buscamos o JSON do modelo manualmente primeiro para validar
        const response = await fetch(`${API_URL}/api/model/load`);
        if (!response.ok) throw new Error("Modelo não encontrado no banco.");
        
        const modelArtifacts = await response.json();

        // Carregamos o modelo usando o IO Handler do TFJS para objetos JSON
        _model = await tf.loadLayersModel(tf.io.fromMemory(
            modelArtifacts.modelTopology,
            modelArtifacts.weightSpecs,
            // Convertemos o Base64 de volta para ArrayBuffer
            Uint8Array.from(atob(modelArtifacts.weightData), c => c.charCodeAt(0)).buffer
        ));

        console.log('🧠 Modelo carregado e hidratado com sucesso!');

        // Carrega o contexto normalmente
        const contextRes = await fetch(`${API_URL}/api/context/load`);
        const savedContext = await contextRes.json();
        
        _globalCtx = {
            ...savedContext,
            categoriesIndex: Object.fromEntries((savedContext.categories || []).map((c, i) => [c, i])),
            colorsIndex: Object.fromEntries((savedContext.colors || []).map((c, i) => [c, i])),
            numCategories: (savedContext.categories || []).length,
            numColors: (savedContext.colors || []).length,
            dimentions: 2 + (savedContext.categories || []).length + (savedContext.colors || []).length
        };

        postMessage({ type: workerEvents.trainingComplete, isPreTrained: true });
    } catch (e) {
        console.warn('ℹ️ Erro ao carregar modelo:', e.message);
    }
}

async function recommend_hibrido({ user }) {
    if (!_globalCtx || !_model) return;

    try {
        const userVectorTensor = encodeUser(user, _globalCtx);
        const userVectorArray = Array.from(userVectorTensor.dataSync());

        const response = await fetch('http://localhost:3001/api/products/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userVector: userVectorArray, limit: 100 })
        });
        
        const candidates = await response.json();
        if (!candidates.length) return;

        const inputs = candidates.map(product => {
            let pVec = typeof product.embedding === 'string' ? JSON.parse(product.embedding) : product.embedding;
            return [...userVectorArray, ...pVec];
        });

        const inputsTensor = tf.tensor2d(inputs);
        const predictions = _model.predict(inputsTensor);
        const scores = await predictions.data();

        const finalRecommendations = candidates.map((p, i) => ({
            ...p,
            neuralScore: scores[i] 
        })).sort((a, b) => b.neuralScore - a.neuralScore);
        
        postMessage({
            type: workerEvents.recommend,
            user,
            recommendations: finalRecommendations.slice(0, 10) 
        });

        userVectorTensor.dispose();
        inputsTensor.dispose();
        predictions.dispose();
    } catch (e) {
        console.error("❌ Erro na recomendação:", e);
    }
}

// --- HANDLERS ---

const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend_hibrido,
};

loadExistingModel();

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};