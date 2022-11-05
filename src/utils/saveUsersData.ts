import FS from 'fs-extra';
import path from 'path';
import { UsersDataBase, UsersData } from '../common/props.js';
import { sleep, getUserInfoData } from './index.js';

/**
 * 用于更新用户数据，最终数据
 */
let users: UsersData[] = [];

export async function saveUserData(data: UsersData[], type: string = '') {
  await FS.outputFile(path.join(process.cwd(), 'dist', `users${type}.json`), JSON.stringify(data, null, 2));
}

async function saveCacheUserData(data: UsersData[], type: string = '') {
  await FS.outputFile(path.join(process.cwd(), '.cache', `users${type}.json`), JSON.stringify(data, null, 2));
}

async function getInfo(arr: UsersDataBase[], type: string = '', globalUsers: UsersData[] = []) {
  const user: UsersDataBase = arr[0];
  if (!user) {
    return;
  }
  console.log(`\n-> 获取 ${user.login} 的更多信息！`);
  let isLocalData = true;
  let findUser: UsersData = globalUsers.find(item => item.login === user.login);
  if (!findUser?.followers) {
    isLocalData = false;
    findUser = await getUserInfoData(user.login);
    if (findUser.message && findUser.documentation_url) {
      console.log(`<- 还剩 ${arr.length} 个用户信息！error: ${findUser.message} -> ${findUser.documentation_url}`);
      return;
    } else if (!findUser.followers) {
      console.log(`<- 用户 ${user.login} 的数据获取失败，重新获取！`);
      await sleep(2000);
      await getInfo(arr, type, globalUsers);
      return;
    }
  }
  
  users.push(findUser);
  await saveUserData([...users], type);
  // 获取成功删除第一条
  arr.shift();
  await saveCacheUserData(arr, type);
  console.log(`<- 用户 [${user.login}, followers:${findUser.followers}] 的数据获取完成！还剩 ${arr.length} 个用户信息！`);
  // console.log(`<- 用户 [${user.login}, star:${findUser._stars}, followers:${findUser.followers}] 的数据获取完成！还剩 ${arr.length} 个用户信息！`);
  if (!isLocalData) {
    await sleep(1000);
  }
  await getInfo(arr, type, globalUsers);
}

/**
 * 用户数据根据 `followers` 排序
 * @param {UsersData[]} users 用户数据
 */
function sortUser(users: UsersData[]) {
  users.sort((a: UsersData, b: UsersData) => {
    if (b.followers && a.followers) {
      return b.followers - a.followers;
    }
    return 0;
  });
  users = users.map((item: UsersData, idx: number) => {
    item.rank = idx + 1;
    return item;
  });
  return users;
}

/**
 * 更新用户信息
 * @param {String} usersPath 原始用户数据。
 * @param {String} cachePath 缓存用户数据。
 * @param {String} type 类型，取值 `空` | 或者 `.china` 用于存储。
 * @param {UsersData[]} globalUsers 全球用户，已完成获取数据，过滤不再请求 API 了
 */
export async function updateUsersData(usersPath: string, cachePath: string, type: '' | '.china', globalUsers?: UsersData[]) {
  const usersDist: UsersData[] = await FS.readJSON(path.resolve(usersPath));
  const cacheUsers: UsersDataBase[] = await FS.readJSON(path.resolve(cachePath));

  users = Array.from([...cacheUsers]).map(item => {
    const userFilter = usersDist.find(data => item.login === data.login);
    return { ...userFilter, ...item };
  })
  console.log(`👉  完成用户新数据与老数据合并 ${users.length}`);
  // 数据去重
  let result = reduce([...users]);
  console.log(`👉  完成用户数据去重 ${result.length}`);
  if (result && result.length > 0) {
    await getInfo([...result], type, globalUsers);
  }

  let resultInfo: UsersData[] = await FS.readJSON(path.resolve(usersPath));;
  console.log(`👉  完成用户详情获取 ${resultInfo.length}`);
  resultInfo = sortUser([...resultInfo]);
  console.log(`👉  完成用户数据排序 ${resultInfo.length}`);
  // 数据去重
  resultInfo = reduce(resultInfo);
  resultInfo.splice(1000, resultInfo.length);
  console.log(`👉  截取前 500 条数据 ${resultInfo.length}`);
  await saveUserData(resultInfo, type);
  return [...resultInfo];
}

/**
 * 数据去重
 * @param data 
 * @returns 
 */
function reduce(data: UsersDataBase[] = []) {
  const obj2: Record<string, boolean> = {};
  return [...data].reduce<UsersDataBase[]>((item, next) => {
    obj2[next.login] ? '' : (obj2[next.login] = true) && item.push(next);
    return item
  }, []);
}