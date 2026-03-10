const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PHP_URL = "https://livestream.ct.ws/extensao/log.php";

app.post('/login-proxy', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ status: "error", message: "Dados incompletos" });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Define um User-Agent real para evitar ser detectado como bot
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        // 1. Acessa a URL via GET primeiro para quebrar o desafio do InfinityFree
        await page.goto(PHP_URL, { waitUntil: 'networkidle2' });

        // 2. Executa o POST usando o contexto do navegador (que já tem os cookies do desafio resolvido)
        const result = await page.evaluate(async (url, email, senha) => {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('senha', senha);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            return await response.text();
        }, PHP_URL, email, senha);

        // Tenta converter a resposta para JSON, se falhar, envia o texto puro (HTML de erro)
        try {
            const jsonResponse = JSON.parse(result);
            res.json(jsonResponse);
        } catch (e) {
            res.json({ status: "html_response", content: result });
        }

    } catch (error) {
        console.error("Erro no Proxy:", error);
        res.status(500).json({ status: "error", message: "Erro no servidor Render: " + error.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
