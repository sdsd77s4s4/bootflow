// =====================================================
// TESTE RÁPIDO DE CONEXÃO - PROJETO tgffflpfilsxikqhnkuj
// =====================================================

const testConnection = async () => {
  console.log('🔍 Testando conexão com novo projeto Supabase...\n');
  
  const url = 'https://tgffflpfilsxikqhnkuj.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZmZmbHBmaWxzeGlrcWhua3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzQ5OTcsImV4cCI6MjA2OTE1MDk5N30.qMzjJOJkPeW2hN9jD_uCW1MTlJgzstSyxm78ia0IdIM';
  
  try {
    console.log(`📡 Testando: ${url}`);
    
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok) {
      console.log('✅ Conexão bem-sucedida!');
      console.log(`   Status: ${response.status}`);
      console.log(`   URL funcionando: ${url}\n`);
      
      // Testar tabelas específicas
      console.log('🔍 Testando tabelas...');
      
      const tables = ['users', 'resellers', 'cobrancas'];
      for (const table of tables) {
        try {
          const tableResponse = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          });
          
          if (tableResponse.ok) {
            console.log(`   ✅ Tabela ${table}: OK`);
          } else {
            console.log(`   ❌ Tabela ${table}: Erro ${tableResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Tabela ${table}: ${error.message}`);
        }
      }
      
      console.log('\n🎉 Projeto configurado com sucesso!');
      console.log('   Agora você pode usar a aplicação normalmente.');
      
    } else {
      console.log(`❌ Erro HTTP: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}\n`);
      console.log('💡 Verifique se executou o SQL no projeto Supabase.');
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}\n`);
    console.log('💡 Verifique se o projeto Supabase está ativo.');
  }
};

// Executar teste
testConnection(); 