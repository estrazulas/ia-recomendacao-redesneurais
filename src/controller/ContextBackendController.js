import { query } from '../config/db.js';

export class ContextBackendController {
    
    // 1. Salva o Contexto (Metadados: Preços, Categorias, etc)
    static async saveContext(req, res) {
        try {
            const sql = `
                INSERT INTO model_configs (key, data)
                VALUES ('global_normalization_context', $1)
                ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP;
            `;
            await query(sql, [JSON.stringify(req.body)]);
            res.status(200).json({ message: "Contexto salvo!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 2. Salva o Modelo (O Cérebro/Pesos da IA) <--- ADICIONE ESTA
    static async saveModel(req, res) {
        try {
            const { modelTopology, weightSpecs, weightData } = req.body;
            const sql = `
                INSERT INTO model_configs (key, data)
                VALUES ('trained_model', $1)
                ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP;
            `;
            // Salvamos tudo como um JSON gigante no campo 'data'
            await query(sql, [JSON.stringify({ modelTopology, weightSpecs, weightData })]);
            
            console.log("🧠 Modelo (pesos) salvo no Postgres!");
            res.status(200).json({ message: "Modelo salvo no banco!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 3. Busca o Contexto
    static async getContext(req, res) {
        try {
            const { rows } = await query("SELECT data FROM model_configs WHERE key = 'global_normalization_context'");
            if (rows.length === 0) return res.status(404).json({ message: "404 Contexto" });
            res.json(rows[0].data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 4. Busca o Modelo (O que o Worker chama no Load)
    static async getModel(req, res) {
    try {
        const sql = `SELECT data FROM model_configs WHERE key = 'trained_model'`;
        const { rows } = await query(sql);

        if (rows.length === 0) return res.status(404).json({ message: "Modelo não encontrado" });

        const modelData = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;

        // Retornamos o objeto completo salvo no saveModel
        res.json({
            modelTopology: modelData.modelTopology,
            weightSpecs: modelData.weightSpecs,
            weightData: modelData.weightData // A string Base64 pura
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
}