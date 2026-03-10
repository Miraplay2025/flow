const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/auth', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ status: "error", message: "E-mail e senha obrigatórios." });
    }

    let browser;
    try {
        // Inicia o navegador com os argumentos necessários para rodar no Docker/Render
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            executablePath: '/usr/bin/google-chrome-stable' // Otimizado para o Docker
        });

        const page = await browser.newPage();
        
        // URL da sua hospedagem na InfinityFree
        const loginUrl = `http://livestream.ct.ws/extensão/log.php?email=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`;
        
        console.log(`Verificando login para: ${email}`);
        
        // Navega até o PHP (isso resolve o desafio AES do JavaScript da InfinityFree automaticamente)
        await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Pega o texto da página (que deve ser o seu JSON do PHP)
        const responseText = await page.evaluate(() => document.body.innerText);
        
        try {
            const jsonResponse = JSON.parse(responseText);
            res.json(jsonResponse);
        } catch (e) {
            res.status(500).json({ status: "error", message: "Resposta do servidor inválida.", details: responseText });
        }

    } catch (error) {
        console.error("Erro no Puppeteer:", error);
        res.status(500).json({ status: "error", message: "Erro de conexão com o servidor de autenticação." });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
