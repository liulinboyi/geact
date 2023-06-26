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

const ReactElement = function (
	type: ElementType,
	key: Key,
	ref: Ref,
	props: Props
): ReactElement {
	const element: ReactElement = {
		$$typeof: REACT_ELEMENT_TYPE,
		type: type,
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

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (hasValidKey(config)) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref' && val !== undefined) {
			if (hasValidRef(config)) {
				ref = '' + val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	return ReactElement(type, key, ref, props);
};

export const jsxDEV = jsx;
