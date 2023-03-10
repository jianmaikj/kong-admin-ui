
//使用递归实现深拷贝
export function deepClone(obj) {
    //判断拷贝的obj是对象还是数组
    let objClone = Array.isArray(obj) ? [] : {};
    if (obj && typeof obj === "object") { //obj不能为空，并且是对象或者是数组 因为null也是object
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] && typeof obj[key] === "object") { //obj里面属性值不为空并且还是对象，进行深度拷贝
                    objClone[key] = deepClone(obj[key]); //递归进行深度的拷贝
                } else {
                    objClone[key] = obj[key]; //直接拷贝
                }
            }
        }
    }
    return objClone;
}