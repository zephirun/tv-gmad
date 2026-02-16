import fs from 'fs';
import path from 'path';

export default function localApiPlugin() {
    return {
        name: 'local-api-plugin',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                // Endpoint para buscar todos os dados locais
                if (req.url === '/api/get-local-data' && req.method === 'GET') {
                    try {
                        const jsonPath = path.resolve(process.cwd(), 'src/data/local_cities.json');
                        let currentData = {};
                        if (fs.existsSync(jsonPath)) {
                            currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(currentData));
                    } catch (err) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                    }
                    return;
                }

                // Endpoint para salvar dados JSON (notícias, configurações, etc)
                if (req.url === '/api/save-city-data' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const { cityKey, data } = JSON.parse(body);
                            const jsonPath = path.resolve(process.cwd(), 'src/data/local_cities.json');

                            let currentData = {};
                            if (fs.existsSync(jsonPath)) {
                                currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                            }

                            if (!currentData[cityKey]) currentData[cityKey] = {};
                            Object.assign(currentData[cityKey], data);

                            fs.writeFileSync(jsonPath, JSON.stringify(currentData, null, 2));

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true }));
                        } catch (err) {
                            console.error('Error saving data:', err);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                    return;
                }

                // Endpoint para upload de arquivos
                if (req.url === '/api/upload' && req.method === 'POST') {
                    const cityName = req.headers['x-city-name'] || 'madville';
                    const fileName = req.headers['x-file-name'] || `upload_${Date.now()}.mp4`;
                    const uploadDir = path.resolve(process.cwd(), 'public', cityName);

                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    const filePath = path.join(uploadDir, fileName);
                    const fileStream = fs.createWriteStream(filePath);

                    req.pipe(fileStream);

                    req.on('end', () => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ url: `/${cityName}/${fileName}` }));
                    });

                    req.on('error', (err) => {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                    });
                    return;
                }

                next();
            });
        }
    };
}
