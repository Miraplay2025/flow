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
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // URL da sua hospedagem na InfinityFree
        const loginUrl = `http://livestream.ct.ws/extensão/log.php?email=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`;
        
        console.log(`Verificando: ${email}`);
        
        // Timeout de 20s para não travar o Render
        await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 20000 });

        const responseText = await page.evaluate(() => document.body.innerText);
        
        try {
            const jsonResponse = JSON.parse(responseText);
            res.json(jsonResponse);
        } catch (e) {
            // Se não for JSON, pode ser o erro de JS da InfinityFree que não foi resolvido
            res.status(500).json({ status: "error", message: "Erro na resposta do PHP.", details: responseText });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Tempo esgotado ou erro de rede." });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
