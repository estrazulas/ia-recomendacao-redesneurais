import { query } from '../config/db.js';

export class UserBackendController {
    /**
     * Salva ou atualiza o vetor de características (preferências) do usuário.
     * Esse vetor é gerado pelo encodeUser no Worker.
     */
    static async saveUserVector(req, res) {
        const { id, name, vector } = req.body;

        try {
            // Converte o array JS para o formato string '[0.1, 0.2, ...]' do pgvector
            const vectorString = `[${vector.join(',')}]`;

            const sql = `
                INSERT INTO users_vectors (user_id, name, embedding)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id) 
                DO UPDATE SET embedding = $3, name = $2;
            `;

            await query(sql, [id, name, vectorString]);
            res.status(200).send({ message: "Vetor do usuário sincronizado com sucesso!" });
        } catch (error) {
            console.error('Erro ao salvar vetor do usuário:', error);
            res.status(500).send(error.message);
        }
    }

    /**
     * Busca o vetor de um usuário específico. 
     * Útil para recuperar o perfil sem precisar reprocessar compras antigas.
     */
    static async getUserVector(req, res) {
        const { id } = req.params;

        try {
            const sql = `SELECT user_id, name, embedding FROM users_vectors WHERE user_id = $1`;
            const { rows } = await query(sql, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: "Usuário não encontrado" });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Erro ao buscar vetor do usuário:', error);
            res.status(500).send(error.message);
        }
    }
}