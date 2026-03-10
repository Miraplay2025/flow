const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();

// Configurações de Middleware
app.use(express.json());
app.use(cors());

// URL do seu PHP no InfinityFree
const PHP_URL = "https://livestream.ct.ws/extensao/log.php";

// Rota raiz: Essencial para o Cron-job.org monitorar e manter o servidor acordado
app.get('/', (req, res) => {
    res.status(200).send("Proxy Ultra Pro: Ativo e Operante");
});

// Rota de Login: Recebe os dados da extensão e processa via Puppeteer
app.post('/login-proxy', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ 
            status: "error", 
            message: "Dados de login ausentes na requisição." 
        });
    }

    let browser;
    try {
        console.log(`Iniciando tentativa de login para: ${email}`);

        // Lançamento do navegador com flags de otimização para o Render (512MB RAM)
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Evita crash por falta de memória compartilhada
                '--disable-gpu',           // Render não possui GPU
                '--no-first-run',
                '--no-zygote',
                '--single-process'         // Economiza RAM
            ]
        });

        const page = await browser.newPage();
        
        // Define um User-Agent de navegador real para evitar bloqueios
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 1. Navega até o PHP para resolver o desafio AES/Cookie do InfinityFree
        // O Puppeteer resolve o desafio de Javascript automaticamente aqui
        await page.goto(PHP_URL, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // 2. Executa o POST dentro do contexto da página já autenticada
        const result = await page.evaluate(async (url, userEmail, userPass) => {
            const formData = new FormData();
            formData.append('email', userEmail);
            formData.append('senha', userPass);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                return await response.text();
            } catch (err) {
                return JSON.stringify({ status: "error", message: "Falha ao postar no PHP: " + err.message });
            }
        }, PHP_URL, email, senha);

        // 3. Tenta parsear a resposta. Se o PHP retornar JSON, enviamos JSON.
        try {
            const jsonResponse = JSON.parse(result);
            console.log("Resposta do PHP recebida com sucesso.");
            res.json(jsonResponse);
        } catch (e) {
            // Se o PHP retornar erro ou o desafio não foi quebrado, envia o texto bruto
            console.warn("Resposta não-JSON recebida do servidor final.");
            res.json({ 
                status: "server_response", 
                data: result 
            });
        }

    } catch (error) {
        console.error("Erro Crítico no Proxy:", error.message);
        res.status(500).json({ 
            status: "error", 
            message: "Erro no servidor Render: " + error.message 
        });
    } finally {
        // Garante que o navegador seja fechado para não vazar memória RAM
        if (browser) {
            await browser.close();
            console.log("Navegador fechado.");
        }
    }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Proxy rodando na porta ${PORT}`);
});
