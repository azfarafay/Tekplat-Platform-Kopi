const pool = require('./db');

const runMigration = async () => {
    try {
        console.log('⏳ Memulai proses pembuatan tabel...');
        const connection = await pool.getConnection();

        // 1. Buat Tabel Users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('roastery', 'coffee_shop') NOT NULL,
                nib_number VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabel "users" siap!');

        // 2. Buat Tabel Products
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                roastery_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                origin VARCHAR(100),
                roast_level VARCHAR(50),
                price DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (roastery_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel "products" siap!');

        // 3. Buat Tabel Transactions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffee_shop_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processed', 'shipped', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (coffee_shop_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        console.log('✓ Tabel "transactions" siap!');

        connection.release();
        console.log('🚀 Migrasi database selesai dengan sukses!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal melakukan migrasi:', err);
        process.exit(1);
    }
};

runMigration();