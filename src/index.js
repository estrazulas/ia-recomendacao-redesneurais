import { UserController } from './controller/UserController.js';
import { ProductController } from './controller/ProductController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { ProductService } from './service/ProductService.js';
import { UserView } from './view/UserView.js';
import { ProductView } from './view/ProductView.js';
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

// Create shared services
const userService = new UserService();
const productService = new ProductService();

// Create views
const userView = new UserView();
const productView = new ProductView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();
const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });

// Set up worker message handler
const w = WorkerController.init({
    worker: mlWorker,
    events: Events
});

const users = await userService.getDefaultUsers();

async function startApp() {
    // Agora o await é permitido aqui dentro
    const users = await userService.getDefaultUsers();

    // Damos 4 segundos para o Worker baixar o modelo e os JSONs de dados
    setTimeout(() => {
        if (!w.alreadyTrained) { 
            console.log("⚠️ Modelo não encontrado ou corrompido. Iniciando treino...");
            w.triggerTrain(users);
        }
    }, 4000);

    // Continue com as inicializações dos outros controllers...
    userController.renderUsers({ id: 99, name: "Josézin", age: 30, purchases: [] });
}


ModelController.init({
    modelView,
    userService,
    events: Events,
});

TFVisorController.init({
    tfVisorView,
    events: Events,
});

ProductController.init({
    productView,
    userService,
    productService,
    events: Events,
});


const userController = UserController.init({
    userView,
    userService,
    productService,
    events: Events,
});


userController.renderUsers({
    "id": 99,
    "name": "Josézin da Silva",
    "age": 30,
    "purchases": []
});


startApp();