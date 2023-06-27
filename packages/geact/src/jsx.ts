type Ref = any;
type ElementType = any;
type Key = string | null;
type Props = {
	[key: string]: any;
	children?: ReactElement;
};

interface ReactElement {
	$$typeof: symbol;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}

const REACT_ELEMENT_TYPE = Symbol.for('react.element');

// ReactElement 定义
const ReactElement = function (
	type: ElementType,
	key: Key,
	ref: Ref,
	props: Props
): ReactElement {
	const element: ReactElement = {
		$$typeof: REACT_ELEMENT_TYPE, // 内部字段，用来判断类型
		type: type, // 类型
		key,
		ref,
		props,
		__mark: 'Mark'
	};

	return element;
};

function hasValidKey(config: any) {
	return config.key !== undefined;
}

function hasValidRef(config: any) {
	return config.ref !== undefined;
}

const jsx = (type: ElementType, config: any) => {
	let key: Key = null;
	const props: any = {};
	let ref: Ref = null;

	// 遍历 prop
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (hasValidKey(config)) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (hasValidRef(config)) {
				ref = '' + val;
			}
			continue;
		}
		// 判断 当前属性是否是在props上，而非在其原型上
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	// 返回ReactElement 如果是嵌套关系，则返回，作为children的值
	// 比如：
	/*
	const jsx2 = jsx("div", {
		children: jsx("span", {
			children: "demo"
		})
	});
	 */
	return ReactElement(type, key, ref, props);
};

export const jsxDEV = jsx;
