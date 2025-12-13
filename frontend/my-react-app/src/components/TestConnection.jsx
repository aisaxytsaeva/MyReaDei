import React, { useEffect, useState } from 'react';

const TestConnection = () => {
  const [debugInfo, setDebugInfo] = useState('');
  const [testResults, setTestResults] = useState('');

  useEffect(() => {
    // Соберем всю отладочную информацию
    const debugData = `
      === ДЕБАГ ИНФОРМАЦИЯ ===
      
      1. Все env переменные:
      ${JSON.stringify(import.meta.env, null, 2)}
      
      2. Конкретные переменные:
      - MODE: ${import.meta.env.MODE}
      - DEV: ${import.meta.env.DEV}
      - PROD: ${import.meta.env.PROD}
      - VITE_API_URL: "${import.meta.env.VITE_API_URL}"
      - BASE_URL: ${import.meta.env.BASE_URL}
      
      3. Проверка window:
      - window.location: ${window.location.href}
      - window.origin: ${window.origin}
      
      4. Пробуем получить env по-разному:
      - import.meta.env.VITE_API_URL: "${import.meta.env.VITE_API_URL}"
      - process.env.NODE_ENV: "${process.env.NODE_ENV}"
      - window.__VITE_API_URL__: "${window.__VITE_API_URL__}"
    `;
    
    setDebugInfo(debugData);
    console.log('Debug Info:', debugData);
    
    // Тестируем соединение
    runConnectionTest();
  }, []);

  const runConnectionTest = async () => {
    let results = '=== РЕЗУЛЬТАТЫ ТЕСТА ===\n\n';
    
    // 1. Определяем URL для теста
    const possibleUrls = [
      import.meta.env.VITE_API_URL,
      'http://127.0.0.1:8000',
      'http://localhost:8000',
      '/api'
    ];
    
    results += `Возможные URL для теста:\n`;
    possibleUrls.forEach((url, i) => {
      results += `  ${i + 1}. ${url || '(undefined)'}\n`;
    });
    
    // 2. Тестируем каждый URL
    for (let i = 0; i < possibleUrls.length; i++) {
      const url = possibleUrls[i];
      if (!url) continue;
      
      results += `\n--- Тест ${i + 1}: ${url} ---\n`;
      
      try {
        // Проверяем корневой эндпоинт
        const testUrl = url === '/api' ? '/api/' : `${url}/`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          results += `✅ УСПЕХ: ${JSON.stringify(data)}\n`;
          
          // Если этот URL работает, тестируем /books
          try {
            const booksUrl = url === '/api' ? '/api/books' : `${url}/books`;
            const booksResponse = await fetch(booksUrl);
            if (booksResponse.ok) {
              const booksData = await booksResponse.json();
              results += `📚 Книг получено: ${booksData.length || 0}\n`;
            }
          } catch (e) {
            results += `📚 Ошибка книг: ${e.message}\n`;
          }
          
          break; // Останавливаемся на первом работающем URL
        } else {
          results += `❌ HTTP ${response.status}: ${response.statusText}\n`;
        }
      } catch (error) {
        results += `❌ ОШИБКА: ${error.message}\n`;
      }
    }
    
    setTestResults(results);
  };

  const forceReload = () => {
    window.location.reload();
  };

  const openDevTools = () => {
    console.log('=== ВСЕ ENV ПЕРЕМЕННЫЕ ===');
    console.log(import.meta.env);
    console.log('=== window object ===');
    console.log(window);
    alert('Откройте консоль браузера (F12 → Console)');
  };

  return (
    <div style={{ 
      padding: '30px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🔧 Диагностика подключения</h1>
      
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3>🚀 Быстрые действия:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
          <button 
            onClick={runConnectionTest}
            style={{
              padding: '12px 24px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Запустить тест
          </button>
          
          <button 
            onClick={forceReload}
            style={{
              padding: '12px 24px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔁 Перезагрузить страницу
          </button>
          
          <button 
            onClick={openDevTools}
            style={{
              padding: '12px 24px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🛠️ Открыть DevTools
          </button>
        </div>
      </div>
      
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.3)', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3>📊 Результаты теста:</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '15px',
          borderRadius: '5px',
          overflowX: 'auto'
        }}>
          {testResults || 'Нажмите "Запустить тест"'}
        </pre>
      </div>
      
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.3)', 
        padding: '20px', 
        borderRadius: '10px'
      }}>
        <h3>🔍 Отладочная информация:</h3>
        <button 
          onClick={() => {
            const el = document.getElementById('debug-info');
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
          }}
          style={{
            padding: '10px 20px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          Показать/скрыть детали
        </button>
        <pre id="debug-info" style={{ 
          whiteSpace: 'pre-wrap', 
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '15px',
          borderRadius: '5px',
          overflowX: 'auto',
          fontSize: '12px',
          display: 'none'
        }}>
          {debugInfo}
        </pre>
      </div>
      
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px'
      }}>
        <h3>💡 Решение проблемы:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>Создайте файл .env в папке frontend/my-react-app/</strong></li>
          <li><strong>Содержимое файла .env:</strong>
            <pre style={{ background: 'black', padding: '10px', borderRadius: '5px' }}>
VITE_API_URL=http://127.0.0.1:8000
            </pre>
          </li>
          <li><strong>Перезапустите Vite:</strong>
            <pre style={{ background: 'black', padding: '10px', borderRadius: '5px' }}>
# Остановите текущий процесс (Ctrl+C)
cd frontend/my-react-app
npm run dev
            </pre>
          </li>
          <li><strong>Или хардкодьте URL в коде:</strong>
            <pre style={{ background: 'black', padding: '10px', borderRadius: '5px' }}>
// В api.js измените:
const API_BASE_URL = 'http://127.0.0.1:8000'; // вместо import.meta.env.VITE_API_URL
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default TestConnection;