import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const dbPath = path.join(__dirname, 'vaults.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createVaultsTable = `
      CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        token_mint TEXT NOT NULL,
        distribution_wallet TEXT NOT NULL,
        treasury_wallet TEXT NOT NULL,
        dev_wallet TEXT NOT NULL,
        start_date TEXT NOT NULL,
        endgame_date TEXT NOT NULL,
        timer_duration INTEGER NOT NULL,
        distribution_interval INTEGER NOT NULL,
        min_hold_amount INTEGER NOT NULL,
        tax_split_dev INTEGER NOT NULL,
        tax_split_holders INTEGER NOT NULL,
        vault_asset TEXT NOT NULL,
        airdrop_asset TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    const createWhitelistedAddressesTable = `
      CREATE TABLE IF NOT EXISTS whitelisted_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vault_id TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
        UNIQUE(vault_id, address)
      )
    `;

    this.db.run(createVaultsTable, (err) => {
      if (err) {
        console.error('Error creating vaults table:', err);
      } else {
        console.log('✅ Vaults table created/verified');
      }
    });

    this.db.run(createWhitelistedAddressesTable, (err) => {
      if (err) {
        console.error('Error creating whitelisted_addresses table:', err);
      } else {
        console.log('✅ Whitelisted addresses table created/verified');
      }
    });
  }

  // Vault CRUD operations
  async createVault(vaultData) {
    return new Promise((resolve, reject) => {
      const {
        id, name, description, tokenMint, distributionWallet, treasuryWallet,
        devWallet, startDate, endgameDate, timerDuration, distributionInterval,
        minHoldAmount, taxSplit, vaultAsset, airdropAsset, status = 'draft'
      } = vaultData;

      const now = new Date().toISOString();
      const sql = `
        INSERT INTO vaults (
          id, name, description, token_mint, distribution_wallet, treasury_wallet,
          dev_wallet, start_date, endgame_date, timer_duration, distribution_interval,
          min_hold_amount, tax_split_dev, tax_split_holders, vault_asset, airdrop_asset,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        id, name, description, tokenMint, distributionWallet, treasuryWallet,
        devWallet, startDate, endgameDate, timerDuration, distributionInterval,
        minHoldAmount, taxSplit.dev, taxSplit.holders, vaultAsset, airdropAsset,
        status, now, now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...vaultData });
        }
      });
    });
  }

  async getVault(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM vaults WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const vault = this.mapRowToVault(row);
          resolve(vault);
        } else {
          resolve(null);
        }
      });
    });
  }

  async getAllVaults() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM vaults ORDER BY created_at DESC';
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const vaults = rows.map(row => this.mapRowToVault(row));
          resolve(vaults);
        }
      });
    });
  }

  async updateVault(id, updates) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['name', 'description', 'status'];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        resolve({ id, ...updates });
        return;
      }

      values.push(new Date().toISOString()); // updated_at
      values.push(id);

      const sql = `UPDATE vaults SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`;
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...updates });
        }
      });
    });
  }

  async updateVaultStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE vaults SET status = ?, updated_at = ? WHERE id = ?';
      const values = [status, new Date().toISOString(), id];
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, status });
        }
      });
    });
  }

  async deleteVault(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM vaults WHERE id = ?';
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  }

  // Whitelisted addresses operations
  async getWhitelistedAddresses(vaultId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT address FROM whitelisted_addresses WHERE vault_id = ?';
      this.db.all(sql, [vaultId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const addresses = rows.map(row => row.address);
          resolve(addresses);
        }
      });
    });
  }

  async addWhitelistedAddress(vaultId, address) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO whitelisted_addresses (vault_id, address, created_at) VALUES (?, ?, ?)';
      const now = new Date().toISOString();
      
      this.db.run(sql, [vaultId, address, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ vaultId, address });
        }
      });
    });
  }

  async removeWhitelistedAddress(vaultId, address) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM whitelisted_addresses WHERE vault_id = ? AND address = ?';
      this.db.run(sql, [vaultId, address], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ removed: this.changes > 0 });
        }
      });
    });
  }

  async updateWhitelistedAddresses(vaultId, addresses) {
    return new Promise(async (resolve, reject) => {
      try {
        // Remove all existing addresses
        await this.removeAllWhitelistedAddresses(vaultId);
        
        // Add new addresses
        for (const address of addresses) {
          await this.addWhitelistedAddress(vaultId, address);
        }
        
        resolve({ vaultId, addresses });
      } catch (err) {
        reject(err);
      }
    });
  }

  async removeAllWhitelistedAddresses(vaultId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM whitelisted_addresses WHERE vault_id = ?';
      this.db.run(sql, [vaultId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ removed: this.changes });
        }
      });
    });
  }

  // Helper method to map database row to vault object
  mapRowToVault(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tokenMint: row.token_mint,
      distributionWallet: row.distribution_wallet,
      treasuryWallet: row.treasury_wallet,
      devWallet: row.dev_wallet,
      startDate: row.start_date,
      endgameDate: row.endgame_date,
      timerDuration: row.timer_duration,
      distributionInterval: row.distribution_interval,
      minHoldAmount: row.min_hold_amount,
      taxSplit: {
        dev: row.tax_split_dev,
        holders: row.tax_split_holders
      },
      vaultAsset: row.vault_asset,
      airdropAsset: row.airdrop_asset,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Initialize with default REVS vault
  async initializeDefaultVault() {
    try {
      const existingVault = await this.getVault('revs-vault-001');
      if (existingVault) {
        console.log('✅ Default REVS vault already exists');
        return existingVault;
      }

      const defaultVault = {
        id: 'revs-vault-001',
        name: 'REVS Treasury Vault',
        description: 'Test vault using REVS token for dynamic treasury mechanics',
        tokenMint: '9VxExA1iRPbuLLdSJ2rBxsyLReT4aqzZBMaBaY1p',
        distributionWallet: '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE',
        treasuryWallet: 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH',
        devWallet: '6voYG6Us...ZtLMytKW',
        startDate: '2025-09-15T12:00:00Z',
        endgameDate: '2025-12-24T12:00:00Z',
        timerDuration: 3600, // 1 hour
        distributionInterval: 300, // 5 minutes
        minHoldAmount: 200000,
        taxSplit: { dev: 50, holders: 50 },
        vaultAsset: 'SOL',
        airdropAsset: 'REVS',
        status: 'active'
      };

      const vault = await this.createVault(defaultVault);
      
      // Add default whitelisted addresses
      await this.addWhitelistedAddress('revs-vault-001', '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE');
      await this.addWhitelistedAddress('revs-vault-001', 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH');
      
      console.log('✅ Default REVS vault created');
      return vault;
    } catch (err) {
      console.error('Error initializing default vault:', err);
    }
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

export default Database;
