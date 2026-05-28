const pool = require('./db');

const fixTable = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('⏳ Menambahkan kolom baru ke tabel transactions...');

        // Perintah SQL untuk menambahkan kolom yang kurang
        await connection.query(`
            ALTER TABLE transactions 
            ADD COLUMN roastery_id INT NOT NULL AFTER product_id,
            ADD COLUMN unit_price DECIMAL(10, 2) NOT NULL AFTER quantity,
            ADD COLUMN discount_applied BOOLEAN DEFAULT FALSE AFTER total_price
        `);

        connection.release();
        console.log('✓ Tabel transactions berhasil diperbarui agar sinkron dengan Copilot!');
        process.exit(0);
    } catch (err) {
        // Abaikan error jika kolom sudah ada
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('✓ Kolom sudah ada, aman!');
            process.exit(0);
        }
        console.error('❌ Gagal memperbarui tabel:', err.message);
        process.exit(1);
    }
};

fixTable();