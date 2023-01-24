## Change Log

### 3.0.0 (2023-01-23)
- Make the observable update asynchronous by default, to prevent "ResizeObserver loop limit exceeded" error.
- Add `sync` option to get to old behavior
- Add es2020, es2021, and es2022 targets
- Update dependencies
- Require React 17 | 18 in peer dependecies
- Require Node.js 16 for building

### 2.1.2 (2021-03-19)
- Include React 17+ in peer dependecies

### 2.1.1 (2021-03-19)
- Use createElement to not depend on the React import

### 2.1.0 (2019-10-30)
- Take offsetWidth/Height instead of getBoundingClientRect to ignore `transform: scale`

### 2.0.2 (2019-10-23)
- Add es2018/19 exports to the package.json

### 2.0.1 (2019-10-23)
- Republish the right build

### 2.0.0 (2019-10-23)
- Refactor with React Hooks (@klimashkin)
- Remove showOnInit option, since breakpoin after first render is set synchronously in useEffect before ResizeObserver starts observing  (@klimashkin)
- Update dependencies (@klimashkin)

### 1.0.0 (2018-03-15)
- Initial release (@klimashkin)