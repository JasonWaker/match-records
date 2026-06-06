const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

const BAIDU_CONFIG = {
    apiKey: process.env.BAIDU_API_KEY || 'gMci6lclkXHPdNddwEPSigbE',
    secretKey: process.env.BAIDU_SECRET_KEY || 'io1QJF8hHOTqulKxwtge5tOIBB9h9TDD'
};

let accessToken = '';
let tokenExpireTime = 0;

async function getAccessToken() {
    const now = Date.now();
    if (accessToken && now < tokenExpireTime) {
        return accessToken;
    }

    const url = 'https://aip.baidubce.com/oauth/2.0/token';
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: BAIDU_CONFIG.apiKey,
        client_secret: BAIDU_CONFIG.secretKey
    });

    const response = await fetch(`${url}?${params}`, { method: 'POST' });
    const data = await response.json();

    if (data.access_token) {
        accessToken = data.access_token;
        tokenExpireTime = now + (data.expires_in - 60) * 1000;
        return accessToken;
    }

    throw new Error('获取access_token失败: ' + JSON.stringify(data));
}

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/ocr', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        const token = await getAccessToken();
        const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `image=${encodeURIComponent(image)}`
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('OCR处理失败:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static('.'));

module.exports = app;