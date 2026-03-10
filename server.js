const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PHP_URL = "https://livestream.ct.ws/extensao/log.php";

app.get('/', (req, res) => res.send("Servidor Ativo"));

app.post('/login-proxy', async (req, res) => {
    const { email, senha } = req.body;
    let browser;

    try {
        // Lançamento ultra-leve para não estourar a RAM de 512MB do Render
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process' 
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');

        // Acessa para quebrar o desafio do InfinityFree
        await page.goto(PHP_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        const result = await page.evaluate(async (url, e, s) => {
            const fd = new FormData();
            fd.append('email', e);
            fd.append('senha', s);
            const resp = await fetch(url, { method: 'POST', body: fd });
            return await resp.text();
        }, PHP_URL, email, senha);

        try {
            res.json(JSON.parse(result));
        } catch {
            res.json({ status: "server_raw", data: result });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
