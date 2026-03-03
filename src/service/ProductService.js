export class ProductService {
    async getProducts() {
        const response = await fetch('./data/products.json');
        return await response.json();
    }

    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(product => product.id === id);
    }

    async getProductsByIds(ids) {
        const products = await this.getProducts();
        return products.filter(product => ids.includes(product.id));
    }

    async syncProductVector(productData) {
        // Agora aponta para a porta 3001
        await fetch('http://localhost:3001/api/products/sync', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    }

    async getRecommendationsFromDB(userVector) {
        // Agora aponta para a porta 3001
        const response = await fetch('http://localhost:3001/api/products/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userVector })
        });
        return await response.json();
    }
}
