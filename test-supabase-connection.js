// =====================================================
// TESTE DE CONEXÃO SUPABASE - BOOTFLOW
// =====================================================
// Execute este script para verificar se o Supabase está funcionando

const testSupabaseConnection = async () => {
  console.log('🔍 Testando conexão com Supabase...\n');

  // URLs para testar
  const urls = [
    'https://zluggifavplgsxzbupiq.supabase.co',
    'https://tgffflpfilsxikqhnkuj.supabase.co'
  ];

  for (const url of urls) {
    console.log(`📡 Testando: ${url}`);
    
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdWdnaWZhdnBsZ3N4emJ1cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0MTgsImV4cCI6MjA2ODY2OTQxOH0.WTwWCO09lVv3JIcI49WX4Ho7cPv6WNUlv5AzsjEBN14',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdWdnaWZhdnBsZ3N4emJ1cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0MTgsImV4cCI6MjA2ODY2OTQxOH0.WTwWCO09lVv3JIcI49WX4Ho7cPv6WNUlv5AzsjEBN14'
        }
      });

      if (response.ok) {
        console.log('✅ Conexão bem-sucedida!');
        console.log(`   Status: ${response.status}`);
        console.log(`   URL funcionando: ${url}\n`);
        return url;
      } else {
        console.log(`❌ Erro HTTP: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}\n`);
    }
  }

  console.log('❌ Nenhuma URL funcionou. Verifique se o projeto Supabase existe.');
  return null;
};

// Teste DNS
const testDNS = async (hostname) => {
  console.log(`🔍 Testando DNS para: ${hostname}`);
  
  try {
    const response = await fetch(`https://dns.google/resolve?name=${hostname}`);
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      console.log('✅ DNS resolvido com sucesso!');
      console.log(`   IP: ${data.Answer[0].data}`);
    } else {
      console.log('❌ DNS não conseguiu resolver o domínio');
    }
  } catch (error) {
    console.log(`❌ Erro ao testar DNS: ${error.message}`);
  }
  console.log('');
};

// Executar testes
const runTests = async () => {
  console.log('🚀 Iniciando testes de conexão Supabase...\n');
  
  // Testar DNS
  await testDNS('zluggifavplgsxzbupiq.supabase.co');
  await testDNS('tgffflpfilsxikqhnkuj.supabase.co');
  
  // Testar conexão
  const workingUrl = await testSupabaseConnection();
  
  if (workingUrl) {
    console.log('🎉 Teste concluído! Use a URL que funcionou.');
    console.log(`   URL recomendada: ${workingUrl}`);
  } else {
    console.log('💡 Recomendações:');
    console.log('   1. Verifique se o projeto Supabase existe');
    console.log('   2. Crie um novo projeto se necessário');
    console.log('   3. Atualize as credenciais no arquivo .env');
    console.log('   4. Execute as migrações SQL');
  }
};

// Executar se estiver no browser
if (typeof window !== 'undefined') {
  runTests();
} else {
  console.log('Execute este script no browser para testar a conexão.');
} 