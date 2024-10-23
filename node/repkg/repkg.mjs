import { promisify } from 'node:util';
import child_process from 'node:child_process';
const execFile = promisify(child_process.execFile);
const exec = promisify(child_process.exec);
import fs from 'node:fs'
import path from 'node:path';

const isProd = process.env.NODE_ENV?.toUpperCase() === 'PROD'

const BASE = isProd ? ['dotnet', '../ConsoleApp.dll'] : '../../RePKG/bin/Release/net472/RePKG.exe'

export class RePKG {
    constructor() {

    }
    run(command) {
        console.log('command is ', command);
        return isProd ? exec(BASE.concat(command).join(' '), { 'encoding': 'utf-8' })
            : execFile(`${BASE}`, command, { 'encoding': 'utf-8' });
    }
    info(command) {
        return this.run(['info'].concat(command))
    }
    extract(command, dir = 'output') {
        return this.run(['extract', '-o', dir].concat(command))
    }
    // 返回[path,...]
    async listImage(dir) {
        console.log('list ', dir);
        let results = [];
        try {
            const files = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const file of files) {
                const filePath = path.join(dir, file.name);

                // 如果是目录，递归调用
                if (file.isDirectory()) {
                    results = results.concat(await this.listImage(filePath));
                }
                // 如果是文件，检查扩展名
                else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(path.extname(file.name).toLowerCase())) {
                    results.push(filePath); // 添加完整路径
                }
            }
        } catch (err) {
            console.error('Error reading directory:', err);
        }

        return results;
    }


}
// Double quotes are used so that the space in the path is not interpreted as
// a delimiter of multiple arguments.

// The $HOME variable is escaped in the first instance, but not in the second.

const repkg = new RePKG()


async function main(params) {
    const r = await repkg.info(['uploads/girl.pkg'])
    console.log('r is ', r);
}

// main()