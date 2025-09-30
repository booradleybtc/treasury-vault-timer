import Database from '../database.js';

class DatabaseOptimizer {
  constructor(database) {
    this.db = database;
    this._intervals = [];
  }

  // Optimize database for production scale
  async optimizeForProduction() {
    console.log('🔧 Optimizing database for production scale...');
    
    try {
      // Create indexes for better performance
      await this.createIndexes();
      
      // Optimize database settings
      await this.optimizeSettings();
      
      // Analyze tables for query optimization
      await this.analyzeTables();
      
      console.log('✅ Database optimization complete');
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      throw error;
    }
  }

  // Create indexes for frequently queried columns
  async createIndexes() {
    const indexes = [
      // Vault status index for lifecycle engine
      'CREATE INDEX IF NOT EXISTS idx_vaults_status ON vaults(status)',
      
      // Vault creation date index for sorting
      'CREATE INDEX IF NOT EXISTS idx_vaults_created_at ON vaults(created_at)',
      
      // Vault update date index for recent activity
      'CREATE INDEX IF NOT EXISTS idx_vaults_updated_at ON vaults(updated_at)',
      
      // Token mint index for token-based queries
      'CREATE INDEX IF NOT EXISTS idx_vaults_token_mint ON vaults(token_mint)',
      
      // Treasury wallet index for balance queries
      'CREATE INDEX IF NOT EXISTS idx_vaults_treasury_wallet ON vaults(treasury_wallet)',
      
      // Timer fields index for active vault queries
      'CREATE INDEX IF NOT EXISTS idx_vaults_timer_ends_at ON vaults(current_timer_ends_at)',
      
      // Endgame date index for lifecycle transitions
      'CREATE INDEX IF NOT EXISTS idx_vaults_endgame_date ON vaults(endgame_date)',
      
      // Whitelisted addresses index
      'CREATE INDEX IF NOT EXISTS idx_whitelisted_vault_id ON whitelisted_addresses(vault_id)',
      'CREATE INDEX IF NOT EXISTS idx_whitelisted_address ON whitelisted_addresses(address)',
      
      // Composite indexes for common queries
      'CREATE INDEX IF NOT EXISTS idx_vaults_status_created ON vaults(status, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_vaults_status_updated ON vaults(status, updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_vaults_timer_status ON vaults(current_timer_ends_at, status)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.execRun(indexSQL);
        console.log(`✅ Created index: ${indexSQL.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️ Index may already exist: ${indexSQL.split(' ')[5]}`);
      }
    }
  }

  // Optimize SQLite settings for production
  async optimizeSettings() {
    const optimizations = [
      // Enable WAL mode for better concurrency
      'PRAGMA journal_mode=WAL',
      
      // Increase cache size (default is 2000 pages, ~8MB)
      'PRAGMA cache_size=10000', // ~40MB cache
      
      // Enable memory-mapped I/O
      'PRAGMA mmap_size=268435456', // 256MB
      
      // Optimize for speed over safety (acceptable for read-heavy workloads)
      'PRAGMA synchronous=NORMAL',
      
      // Increase temp store size
      'PRAGMA temp_store=MEMORY',
      
      // Optimize query planner
      'PRAGMA optimize',
      
      // Set page size for better performance
      'PRAGMA page_size=4096'
    ];

    for (const pragma of optimizations) {
      try {
        await this.execRun(pragma);
        console.log(`✅ Applied optimization: ${pragma}`);
      } catch (error) {
        console.log(`⚠️ Optimization failed: ${pragma}`, error.message);
      }
    }
  }

  // Analyze tables for query optimization
  async analyzeTables() {
    try {
      await this.execRun('ANALYZE');
      console.log('✅ Database analysis complete');
    } catch (error) {
      console.log('⚠️ Database analysis failed:', error.message);
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const stats = {};
      
      // Get table sizes
      const tables = await this.execAll(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      for (const table of tables) {
        const count = await this.execGet(`SELECT COUNT(*) as count FROM ${table.name}`);
        const size = await this.execGet(`
          SELECT COUNT(*) * AVG(LENGTH(CAST(*) AS TEXT)) as size 
          FROM ${table.name}
        `);
        
        stats[table.name] = {
          rowCount: count.count,
          estimatedSize: size.size || 0
        };
      }
      
      // Get index information
      const indexes = await this.execAll(`
        SELECT name, tbl_name, sql FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `);
      
      stats.indexes = indexes;
      
      // Get database file size
      const dbInfo = await this.execGet('PRAGMA page_count');
      const pageSize = await this.execGet('PRAGMA page_size');
      stats.databaseSize = dbInfo.page_count * pageSize;
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { error: error.message };
    }
  }

  // Vacuum database to reclaim space
  async vacuum() {
    try {
      console.log('🧹 Starting database vacuum...');
      await this.execRun('VACUUM');
      console.log('✅ Database vacuum complete');
    } catch (error) {
      console.error('❌ Database vacuum failed:', error);
      throw error;
    }
  }

  // Reindex database
  async reindex() {
    try {
      console.log('🔄 Starting database reindex...');
      await this.execRun('REINDEX');
      console.log('✅ Database reindex complete');
    } catch (error) {
      console.error('❌ Database reindex failed:', error);
      throw error;
    }
  }

  // Check database integrity
  async checkIntegrity() {
    try {
      const result = await this.execGet('PRAGMA integrity_check');
      return result.integrity_check === 'ok';
    } catch (error) {
      console.error('❌ Database integrity check failed:', error);
      return false;
    }
  }

  // Get slow query information (SQLite doesn't have built-in slow query log)
  async getQueryPerformance() {
    try {
      // Get query plan for common queries
      const commonQueries = [
        'SELECT * FROM vaults WHERE status = ? ORDER BY created_at DESC',
        'SELECT * FROM vaults WHERE current_timer_ends_at < ?',
        'SELECT * FROM vaults WHERE endgame_date < ?',
        'SELECT * FROM whitelisted_addresses WHERE vault_id = ?'
      ];
      
      const performance = {};
      
      for (const query of commonQueries) {
        try {
          const plan = await this.execAll(`EXPLAIN QUERY PLAN ${query}`);
          performance[query] = plan;
        } catch (error) {
          performance[query] = { error: error.message };
        }
      }
      
      return performance;
    } catch (error) {
      console.error('Error getting query performance:', error);
      return { error: error.message };
    }
  }

  // Schedule regular maintenance
  scheduleMaintenance() {
    // Clear any existing intervals to avoid duplicates on restarts
    for (const id of this._intervals) clearInterval(id);
    this._intervals = [];
    // Daily optimization
    this._intervals.push(setInterval(async () => {
      try {
        await this.analyzeTables();
        console.log('📊 Daily database analysis complete');
      } catch (error) {
        console.error('❌ Daily database analysis failed:', error);
      }
    }, 24 * 60 * 60 * 1000)); // 24 hours

    // Weekly vacuum
    this._intervals.push(setInterval(async () => {
      try {
        await this.vacuum();
        console.log('🧹 Weekly database vacuum complete');
      } catch (error) {
        console.error('❌ Weekly database vacuum failed:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000)); // 7 days

    // Monthly reindex
    this._intervals.push(setInterval(async () => {
      try {
        await this.reindex();
        console.log('🔄 Monthly database reindex complete');
      } catch (error) {
        console.error('❌ Monthly database reindex failed:', error);
      }
    }, 30 * 24 * 60 * 60 * 1000)); // 30 days
  }

  // Internal helpers to use the underlying sqlite handle safely
  get handle() {
    return this.db && this.db.db && typeof this.db.db.run === 'function' ? this.db.db : null;
  }

  execRun(sql) {
    return new Promise((resolve, reject) => {
      const h = this.handle;
      if (!h) return reject(new Error('SQLite handle not available'));
      h.run(sql, function(err) {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  execGet(sql) {
    return new Promise((resolve, reject) => {
      const h = this.handle;
      if (!h) return reject(new Error('SQLite handle not available'));
      h.get(sql, function(err, row) {
        if (err) return reject(err);
        resolve(row || {});
      });
    });
  }

  execAll(sql) {
    return new Promise((resolve, reject) => {
      const h = this.handle;
      if (!h) return reject(new Error('SQLite handle not available'));
      h.all(sql, function(err, rows) {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}

export default DatabaseOptimizer;
