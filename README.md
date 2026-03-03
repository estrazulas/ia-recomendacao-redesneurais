# E-commerce Recommendation System (IA Híbrida)

Uma aplicação full-stack que utiliza Inteligência Artificial para recomendações personalizadas. O sistema utiliza uma arquitetura moderna baseada em **Redes Neurais** e **Busca Vetorial (Vector Search)**.

## 🚀 Arquitetura de Recomendação Híbrida

O projeto resolve o problema de recomendação em duas etapas:

1.  **Filtragem por Similaridade (pgvector):**
    O sistema realiza uma busca vetorial diretamente no PostgreSQL utilizando a extensão `pgvector`. Ele identifica os 100 produtos mais próximos ao perfil do usuário no espaço vetorial. Isso garante baixa latência e eficiência em grandes bases de dados.

2.  **Refinamento por Rede Neural (TensorFlow.js):**
    Os 100 candidatos filtrados são enviados para um Web Worker. Lá, uma Rede Neural (MLP) processa as características específicas e atribui um "Neural Score". O sistema reordena os produtos e exibe os 10 melhores resultados para o usuário.



## 🏗️ Estrutura do Projeto

* `index.html` - Interface principal da aplicação.
* `src/worker/modelTrainingWorker.js` - Worker responsável pelo treinamento e inferência da IA.
* `src/controller/` - Controladores da API para Produtos, Usuários e Contexto.
* `server.js` - Servidor Node.js configurado para suportar tráfego de modelos de IA (JSON/Base64).

## 🛠️ Tecnologias Utilizadas

* **IA/ML:** TensorFlow.js (Deep Learning no Navegador).
* **Backend:** Node.js & Express.
* **Banco de Dados:** PostgreSQL + `pgvector`.
* **Frontend:** Vanilla JavaScript e CSS moderno.

## ⚙️ Setup e Configuração

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Configurar o Banco de Dados:**
    Certifique-se de ter o PostgreSQL com a extensão `pgvector` habilitada. Crie a tabela necessária:
    ```sql
    CREATE TABLE model_configs (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

3.  **Rodar a aplicação:**
    ```bash
    npm start
    ```

## 🧠 Ciclo de Vida da IA

* **Treinamento:** Ao clicar em "Treinar", a rede neural aprende as correlações entre idade, categoria, cor e preço.
* **Persistência:** Os pesos da rede neural são convertidos para Base64 e salvos no PostgreSQL.
* **Portabilidade:** O modelo é reconstruído em memória (Client-side) sempre que um usuário acessa a página, sem necessidade de arquivos físicos no servidor.