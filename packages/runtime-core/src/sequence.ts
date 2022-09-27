// 最长递增子序列 贪心算法 + 二分查找 + 前序节点反向追溯
export const getSequence = (arr) => {
  const length = arr.length
  const result = [0]
  let resultLastIndex
  let start
  let end
  let middle
  const p = new Array(length).fill(0)
  for(let i = 0; i < length; i++) {
    let arrI= arr[i]
    if (arrI) {
      resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        result.push(i)
        p[i] = resultLastIndex
        continue
      }
      start = 0
      end = result.length - 1
      while(start < end) {
        // 向下取整
        middle = ((start + end) / 2 | 0)
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i
        p[i] = result[end -1]
      }
    }
  }
  let i = result.length
  let last = result[i - 1]
  while(i-- > 0) {
    result[i] = last
    last = p[last]
  }
  return result
}