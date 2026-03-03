import express from 'express';
import cors from 'cors';
import fs from 'fs';          // <--- Faltava importar
import path from 'path';      // <--- Faltava importar
import { ProductBackendController } from './src/controller/ProductBackendController.js';
import { UserBackendController } from './src/controller/UserBackendController.js';
import { ContextBackendController } from './src/controller/ContextBackendController.js';    


const app = express();

app.use(cors());
// Aumentar o limite global para evitar erros de Payload Too Large no modelo
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Torna a pasta do modelo acessível publicamente via HTTP
// Isso permite carregar o modelo com: tf.loadLayersModel('http://localhost:3001/trained_model/model.json')
app.use('/trained_model', express.static(path.resolve('./models')));

app.post('/api/products/sync', ProductBackendController.saveVector);
app.post('/api/products/recommend', ProductBackendController.getRecommendations);

app.post('/api/users/sync', UserBackendController.saveUserVector);
app.get('/api/users/:id/vector', UserBackendController.getUserVector);


// Rotas de Contexto (Regras)
app.post('/api/context/save', ContextBackendController.saveContext);
app.get('/api/context/load', ContextBackendController.getContext);

// Rotas de Modelo (IA) - MANTENHA APENAS ESTAS DUAS
app.post('/api/model/save', ContextBackendController.saveModel);
app.get('/api/model/load', ContextBackendController.getModel);


const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});