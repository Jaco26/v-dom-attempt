
export function createElement(tagName, attrs) {
  const rv = document.createElement(tagName)

  if (attrs) {
    Object.entries(attrs).forEach(([key, val]) => {
      if (key.startsWith('data')) {
        let dataKey = key.slice(5)
          .split('-')
          .reduce((acc, word) => (
            acc + word[0].toUpperCase() + word.slice(1).toLowerCase())
          )
        dataKey = dataKey[0].toLowerCase() + dataKey.slice(1)
        rv.dataset[dataKey] = val
      } else {
        rv.setAttribute(key, val)
      }
    })
  }
  
  return rv
}