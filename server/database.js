import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    // Use persistent storage path in production, local path in development
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'vaults.db');
    
    // Ensure the directory exists for persistent storage
    const dbDir = path.dirname(dbPath);
    if (dbDir !== __dirname && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        // Run lightweight migration before ensuring tables
        this.migrateIfNeeded()
          .then(() => {
            this.createTables();
          })
          .catch((e) => {
            console.error('⚠️ Migration check failed:', e);
            this.createTables();
          });
      }
    });
  }

  createTables() {
    const createVaultsTable = `
      CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        token_mint TEXT,
        distribution_wallet TEXT,
        treasury_wallet TEXT,
        dev_wallet TEXT,
        start_date TEXT,
        endgame_date TEXT,
        timer_duration INTEGER,
        distribution_interval INTEGER,
        min_hold_amount INTEGER,
        tax_split_dev INTEGER,
        tax_split_holders INTEGER,
        vault_asset TEXT,
        airdrop_asset TEXT,
        meta TEXT,
        custom_token_data TEXT,
        status TEXT NOT NULL DEFAULT 'pre_ico',
        timer_started_at TEXT,
        current_timer_ends_at TEXT,
        last_purchase_signature TEXT,
        total_purchases INTEGER DEFAULT 0,
        total_volume REAL DEFAULT 0,
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

  // One-time migration to add meta column and relax NOT NULLs
  async migrateIfNeeded() {
    return new Promise((resolve, reject) => {
      try {
        this.db.all("PRAGMA table_info(vaults)", [], (err, rows) => {
          if (err) {
            // If table doesn't exist yet, nothing to migrate
            return resolve();
          }
          const hasMeta = Array.isArray(rows) && rows.some((r) => r.name === 'meta');
          const hasCustomTokenData = Array.isArray(rows) && rows.some((r) => r.name === 'custom_token_data');
          const hasTimerFields = Array.isArray(rows) && rows.some((r) => r.name === 'timer_started_at');
          
          if (hasMeta && hasCustomTokenData && hasTimerFields) {
            return resolve();
          }

          console.log('🛠️ Running SQLite migration: adding meta column and relaxing constraints...');

          const createVaultsNew = `
            CREATE TABLE IF NOT EXISTS vaults_new (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              token_mint TEXT,
              distribution_wallet TEXT,
              treasury_wallet TEXT,
              dev_wallet TEXT,
              start_date TEXT,
              endgame_date TEXT,
              timer_duration INTEGER,
              distribution_interval INTEGER,
              min_hold_amount INTEGER,
              tax_split_dev INTEGER,
              tax_split_holders INTEGER,
              vault_asset TEXT,
              airdrop_asset TEXT,
              meta TEXT,
              custom_token_data TEXT,
              status TEXT NOT NULL DEFAULT 'pre_ico',
              timer_started_at TEXT,
              current_timer_ends_at TEXT,
              last_purchase_signature TEXT,
              total_purchases INTEGER DEFAULT 0,
              total_volume REAL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `;

          this.db.serialize(() => {
            this.db.run('BEGIN');
            this.db.run(createVaultsNew);
            // Check which columns exist in the old table
            this.db.all("PRAGMA table_info(vaults)", [], (err, oldRows) => {
              if (err) {
                console.error('Error getting old table info:', err);
                return;
              }
              
              const oldColumns = oldRows.map(row => row.name);
              const hasTimerFields = oldColumns.includes('timer_started_at');
              
              // Build dynamic INSERT statement based on available columns
              const insertColumns = [
                'id', 'name', 'description', 'token_mint', 'distribution_wallet', 'treasury_wallet',
                'dev_wallet', 'start_date', 'endgame_date', 'timer_duration', 'distribution_interval',
                'min_hold_amount', 'tax_split_dev', 'tax_split_holders', 'vault_asset', 'airdrop_asset',
                'meta', 'custom_token_data', 'status', 'created_at', 'updated_at'
              ];
              
              const selectColumns = [
                'id', 'name', 'description', 'token_mint', 'distribution_wallet', 'treasury_wallet',
                'dev_wallet', 'start_date', 'endgame_date', 'timer_duration', 'distribution_interval',
                'min_hold_amount', 'tax_split_dev', 'tax_split_holders', 'vault_asset', 'airdrop_asset',
                "COALESCE(meta, '{}') as meta",
                'COALESCE(custom_token_data, NULL) as custom_token_data',
                "COALESCE(status, 'pre_ico') as status",
                'created_at', 'updated_at'
              ];
              
              // Add timer fields if they exist in the old table
              if (hasTimerFields) {
                insertColumns.splice(-2, 0, 'timer_started_at', 'current_timer_ends_at', 'last_purchase_signature', 'total_purchases', 'total_volume');
                selectColumns.splice(-2, 0, 'COALESCE(timer_started_at, NULL) as timer_started_at', 'COALESCE(current_timer_ends_at, NULL) as current_timer_ends_at', 'COALESCE(last_purchase_signature, NULL) as last_purchase_signature', 'COALESCE(total_purchases, 0) as total_purchases', 'COALESCE(total_volume, 0) as total_volume');
              } else {
                // Add default values for new timer fields
                insertColumns.splice(-2, 0, 'timer_started_at', 'current_timer_ends_at', 'last_purchase_signature', 'total_purchases', 'total_volume');
                selectColumns.splice(-2, 0, 'NULL as timer_started_at', 'NULL as current_timer_ends_at', 'NULL as last_purchase_signature', '0 as total_purchases', '0 as total_volume');
              }
              
              const insertSql = `INSERT INTO vaults_new (${insertColumns.join(', ')})
                                SELECT ${selectColumns.join(', ')} FROM vaults`;
              
              this.db.run(insertSql, (insertErr) => {
                if (insertErr) {
                  console.error('Error inserting data:', insertErr);
                  this.db.run('ROLLBACK');
                  return reject(insertErr);
                }
                
                this.db.run('DROP TABLE vaults');
                this.db.run('ALTER TABLE vaults_new RENAME TO vaults');
                this.db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('❌ Migration commit failed:', commitErr);
                    return reject(commitErr);
                  }
                  console.log('✅ SQLite migration complete');
                  resolve();
                });
              });
            });
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Vault CRUD operations
  async createVault(vaultData) {
    return new Promise((resolve, reject) => {
      const {
        id, name, description, tokenMint, distributionWallet, treasuryWallet,
        devWallet, startDate, endgameDate, timerDuration, distributionInterval,
        minHoldAmount, taxSplit = { dev: null, holders: null }, vaultAsset, airdropAsset, meta = {}, customTokenData = null, status = 'draft'
      } = vaultData;

      const now = new Date().toISOString();
      const sql = `
        INSERT INTO vaults (
          id, name, description, token_mint, distribution_wallet, treasury_wallet,
          dev_wallet, start_date, endgame_date, timer_duration, distribution_interval,
          min_hold_amount, tax_split_dev, tax_split_holders, vault_asset, airdrop_asset, meta, custom_token_data,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        id, name, description, tokenMint, distributionWallet, treasuryWallet,
        devWallet, startDate, endgameDate, timerDuration, distributionInterval,
        minHoldAmount, taxSplit.dev, taxSplit.holders, vaultAsset, airdropAsset, JSON.stringify(meta || {}), JSON.stringify(customTokenData || null),
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
      const allowedFields = ['name', 'description', 'status', 'token_mint', 'distribution_wallet', 'treasury_wallet', 'dev_wallet', 'start_date', 'endgame_date', 'timer_duration', 'distribution_interval', 'min_hold_amount', 'tax_split_dev', 'tax_split_holders', 'vault_asset', 'airdrop_asset', 'meta', 'custom_token_data'];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        let column = key;
        if (key === 'tokenMint') column = 'token_mint';
        if (key === 'distributionWallet') column = 'distribution_wallet';
        if (key === 'treasuryWallet') column = 'treasury_wallet';
        if (key === 'devWallet') column = 'dev_wallet';
        if (key === 'startDate') column = 'start_date';
        if (key === 'endgameDate') column = 'endgame_date';
        if (key === 'timerDuration') column = 'timer_duration';
        if (key === 'distributionInterval') column = 'distribution_interval';
        if (key === 'minHoldAmount') column = 'min_hold_amount';
        if (key === 'vaultAsset') column = 'vault_asset';
        if (key === 'airdropAsset') column = 'airdrop_asset';
        if (key === 'taxSplit') {
          if (typeof updates.taxSplit?.dev !== 'undefined') {
            updateFields.push('tax_split_dev = ?');
            values.push(updates.taxSplit.dev);
          }
          if (typeof updates.taxSplit?.holders !== 'undefined') {
            updateFields.push('tax_split_holders = ?');
            values.push(updates.taxSplit.holders);
          }
          return;
        }
        if (key === 'meta') {
          if (allowedFields.includes('meta')) {
            updateFields.push('meta = ?');
            values.push(JSON.stringify(updates.meta || {}));
          }
          return;
        }
        if (key === 'customTokenData') {
          if (allowedFields.includes('custom_token_data')) {
            updateFields.push('custom_token_data = ?');
            values.push(JSON.stringify(updates.customTokenData || null));
          }
          return;
        }
        if (allowedFields.includes(column)) {
          updateFields.push(`${column} = ?`);
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
      meta: row.meta ? JSON.parse(row.meta) : {},
      customTokenData: row.custom_token_data ? JSON.parse(row.custom_token_data) : null,
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
      timerStartedAt: row.timer_started_at,
      currentTimerEndsAt: row.current_timer_ends_at,
      lastPurchaseSignature: row.last_purchase_signature,
      totalPurchases: row.total_purchases || 0,
      totalVolume: row.total_volume || 0,
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
