import { query } from '../config/db.js';

export class ProductBackendController {
    // Salva o produto e o vetor calculado pelo TensorFlow
    static async saveVector(req, res) {
        const { name, category, price, color, vector } = req.body;

        try {
            // O pgvector espera uma string no formato '[0.1, 0.2, ...]'
            const vectorString = `[${vector.join(',')}]`;

            const sql = `
                INSERT INTO products (name, category, price, color, embedding)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (name) 
                DO UPDATE SET embedding = $5, price = $3;
            `;

            await query(sql, [name, category, price, color, vectorString]);
            res.status(200).send({ message: "Vetor salvo no Postgres!" });
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }

    // Busca produtos similares usando o pgvector
    static async getRecommendations(req, res) {
        const { userVector, limit = 10 } = req.body;

        try {
            const vectorString = `[${userVector.join(',')}]`;
            
            // O operador <=> calcula a distância do cosseno (menor é mais similar)
          const sql = `
            SELECT 
                id, 
                name, 
                category, 
                price, 
                color, 
                embedding,  
                (1 - (embedding <=> $1)) as score
            FROM products
            ORDER BY score DESC
            LIMIT $2;
         `;

         debugger

            const { rows } = await query(sql, [vectorString, limit]);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
}