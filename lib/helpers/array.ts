export const chunkArray = (array, chunkSize) => {
  return array.reduce((acc, val, idx) => {
    const chunkIndex = Math.floor(idx / chunkSize)

    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [] // start a new chunk
    }

    acc[chunkIndex].push(val)

    return acc
  }, [])
}
