import { createServer } from 'node:http';
import { RePKG } from './repkg.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import url from 'url';
import querystring from 'querystring';


!fs.existsSync('uploads') && fs.mkdirSync('uploads')
const hostname = '127.0.0.1';
const port = 3000;

const repkg = new RePKG()


const handler = async (req, res) => {
    res.statusCode = 200;
    // res.setHeader('Content-Type', 'text/plain');

    const parsedUrl = url.parse(req.url);
    console.log('recevice[%s] ? [%s]', parsedUrl.pathname, parsedUrl.query);

    switch (parsedUrl.pathname) {
        case '/': {
            const r = await repkg.run()
            res.end(JSON.stringify(r));
            break;
        }
        case '/ls': {
            const query = querystring.parse(parsedUrl.query);
            const r = await repkg.listImage(query.d)
            res.end(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>repkg online</title>
</head>

<body>
    ${r.map(i => '<li><a target="_blank" href=' + i + '>' + i + '</a></li>').join('')}
</body>

</html>
            `);
            break;
        }
        case '/upload': {
            const now = Date.now()
            const boundary = req.headers['content-type'].split('=')[1];

            // 监听数据流
            let rawData = Buffer.alloc(0);

            req.on('data', (chunk) => {
                rawData = Buffer.concat([rawData, chunk]);
            });

            // 数据流结束，解析文件并保存
            req.on('end', async () => {
                const boundaryIndex = rawData.indexOf(boundary);
                const firstPartEnd = rawData.indexOf('\r\n\r\n', boundaryIndex) + 4;
                const lastPartStart = rawData.lastIndexOf(boundary) - 2;

                // 提取文件数据部分
                const fileData = rawData.slice(firstPartEnd, lastPartStart);

                // 提取文件名
                const filenameRegex = /filename="(.+)"/;
                const filenameMatch = rawData.toString().match(filenameRegex);
                const filename = filenameMatch && filenameMatch[1];

                const filePath = `./uploads/${filename}`
                // 保存文件到本地
                const response = fs.writeFileSync(filePath, fileData, 'binary');
                // res.writeHead(200, { 'Content-Type': 'text/plain' })
                const info = await repkg.extract([path.join(cwd(), filePath)], `d/${now}`)

                res.writeHead(301, { Location: `/ls?d=d/${now}` });
                res.end();
                setTimeout(() => {
                    fs.unlinkSync(filePath)
                }, 1000);
            })
            break
        }
        case '/form': {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            const data = fs.readFileSync('repkg-form.html', { encoding: 'utf-8' })
            res.end(data)
            break
        }
        default:
            if (fs.existsSync(parsedUrl.pathname.slice(1))) {
                res.end(fs.readFileSync(parsedUrl.pathname.slice(1)));
            } else {
                res.end('hello world');
            }

            break;
    }
}
const server = createServer(async (req, res) => {
    try {
        await handler(req, res)
    } catch (error) {
        console.log('catch error', error);
        res.setHeader('Content-Type', 'text/plain');
        res.end("catch error " + error)
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);

    setInterval(() => {
        fs.readdirSync('d/').map(i => {
            if (i < Date.now() - 30 * 60 * 1000) {
                console.log('del');
                fs.unlinkSync(`d/${i}`)
            }
        })
    }, 30 * 60 * 1000);
});