import FS from 'fs-extra';
import path from 'path';
import { getUserData, sleep } from './utils/index.js';
import { UsersDataBase } from './common/props.js';

(async () => {
  try {
    let users: UsersDataBase[] = [];
    let data = await getUserData(1, true);
    users = users.concat(data);
    console.log(`-> 获取到第1页，中国用户共${data.length}条数据！`);
    await sleep(1000);

    data = await getUserData(2, true);
    users = users.concat(data);
    console.log(`-> 获取到第2页，中国用户共${data.length}条数据！`);
    await sleep(1000);

    data = await getUserData(3, true);
    users = users.concat(data);
    console.log(`-> 获取到第3页，中国用户共${data.length}条数据！`);
    await sleep(1000);

    data = await getUserData(4, true);
    users = users.concat(data);
    console.log(`-> 获取到第4页，中国用户共${data.length}条数据！`);
    await sleep(1000);

    data = await getUserData(5, true);
    users = users.concat(data);
    console.log(`-> 获取到第5页，中国用户共${data.length}条数据！`);

    // 数据去重
    const obj: Record<string, boolean> = {};
    let result = users.reduce<UsersDataBase[]>((item, next) => {
      obj[next.login] ? '' : (obj[next.login] = true) && item.push(next);
      return item
    }, []);

    result = result.map((item: UsersDataBase, idx: number) => {
      item.rank = idx + 1;
      return item;
    });

    FS.outputFileSync(path.join(process.cwd(), '.cache', 'users.china.json'), JSON.stringify(result, null, 2));
    console.log(`-> 共获取${result.length}条用户数据！`);
  } catch (error) {
    console.log(error);
  }
})()