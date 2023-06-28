import { Key, Props, REACT_ELEMENT_TYPE, ReactElement, Ref } from "./jsx"

// FiberNode Tag
const FunctionComponent = 0
const HostRoot = 3 // 项目挂载的根节点 React.render() 挂载的根节点挂载的FiberNode对应类型
const HostComponent = 5 // 这个<div>对应的FiberNode类型就是HostComponent
const HostText = 6 // 这个<div>123</div>中123对应的FiberNode类型就是HostText
type WorkType = typeof FunctionComponent | typeof HostRoot | typeof HostComponent | typeof HostText
type ExistingChildren = Map<string | number, FiberNode>;

export type Flags = number;
export type Instance = PackagedElement;
export type TextInstance = Text;

export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
export const ChildDeletion = 0b00000000000000000000010000;
export const MutationMask = Placement | Update | ChildDeletion;

let workInProgress: FiberNode | null = null;

class FiberNode {
    tag!: WorkType
    pendingProps!: Props
    memoizedProps!: Props | null
    memoizedState!: any
    key!: Key
    type: any
    stateNode: any
    return!: FiberNode | null
    sibling!: FiberNode | null
    child!: any
    index!: number
    ref: Ref

    alternate!: FiberNode | null // 方便workInProgress与current之间切换 比如 当前FiberNode是workInProgress，则alternate就是current
    updateQueue: unknown;
    flags!: Flags
    deletions!: any[]
    subtreeFlags!: Flags

    _selfType$$!: string // 私有的 自己用
    _UI_OR_WIP!: string // 私有的 UI FIberNode 或者 WorkInProgress

    constructor(tag: WorkType, pendingProps: Props /* 当前FiberNode接下来有哪些Props需要改变 */, key: Key) {
        // 实例的属性
        this.tag = tag
        this.key = key
        this.stateNode = null // 比如这个FiberNode是<div>的话，这个属性就保存的div这个DOM Element
        this.type = null // 类型 比如对于一个FunctionComponent类型来说， type就是函数组件本身

        // 构成树状结构
        // fiberNode 除了 作为一个实例，还需要做一些字段用来表示节点之间的关系
        this.return = null // 指向父FiberNode
        this.sibling = null // 指向当前FiberNode 右边的兄弟FiberNode
        this.child = null // 指向当前FiberNode的孩子FiberNode
        this.index = 0 // 同级的FiberNode有好几个 比如<ul><li></li><li></li><li></li></ul> 这些兄弟li就需要index
        this.ref = null

        // 作为工作单元
        this.pendingProps = pendingProps // 这个工作单元刚开始工作的时候Props是什么 当前FiberNode接下来有哪些Props需要改变
        this.memoizedProps = null // 这个工作单元工作完成之后 props是什么 即工作单元完成之后确定下来的Props是什么
        this.alternate = null
    }
}

/*
reconciler工作方式
对于同一节点，比较其ReactElement和FiberNode
生成子FiberNode，并根据比较的结果生成不同的标记
（插入，删除，移动。。。）
对应不同的宿主环境API的执行

ReactElement存储数据
FiberNode也存储数据，根据它们之间的数据比较的结果 产生各种标记
比如Placement 在浏览环境对应appendChild
根据它们之间的数据比较之后，还能产生子FIberNode
子FIberNode又会和子ReactElement进行比较，又会生成 标记，然后生成孙FiberNode
。。。

当所有的ReactElement比较完之后，会生成一棵FiberNode树
一共会存在两颗FiberNode树：
- current：与当前显示的UI视图对应的FiberNode
- workInProgress：触发更新后，正在reconciler中计算的FiberNode树

这两棵树会来回替换
workInProgress 真实UI更新完成之后，workInProgress就会变成current
然后来了一个新的更新，又会创建新的workInProgress树，UI更新完成后
workInProgress就会变成current
。。。

双缓存




*/

type Disptach<State> = (action: Action<State>) => void;
type Action<State> = State | ((prevState: State) => State);

interface Update<State> {
    action: Action<State>;
}

interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null;
    };
    dispatch: Disptach<State> | null;
}

/**
 * 初始化updateQueue
 * @returns {UpdateQueue<Action>}
 */
const createUpdateQueue = <State>() => {
    return {
        shared: {
            pending: null,
        },
    } as UpdateQueue<State>;
};


class FiberRootNode {
    container: Container; // 不同环境的不同的节点 在浏览器环境 就是 root节点
    current: FiberNode;
    finishedWork: FiberNode | null; // 完成后的hostRootFiber
    _selfType$$: string = 'FiberRootNode'
    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container;
        this.current = hostRootFiber;
        hostRootFiber.stateNode = this; // 在创建FiberRootNode时，将FiberRootNode赋值到stateNode中
        this.finishedWork = null;
    }
}

const validEventTypeList = ['click'];
const elementEventPropsKey = '__props';

interface SyntheticEvent extends Event {
    type: string;
    __stopPropagation: boolean;
}
type EventCallback = (e: SyntheticEvent) => void;

interface PackagedElement extends Element {
    [elementEventPropsKey]: {
        [eventType: string]: EventCallback;
    };
}

/**
 * ReactDOM.createRoot()中调用
 * 1. 创建fiberRootNode 和 hostRootFiber。并建立联系
 * @param {Container} container
 */
function createContainer(container: Container) {
    const hostRootFiber = new FiberNode(HostRoot, {}, null);
    hostRootFiber._selfType$$ = 'HostRootFiber'
    const fiberRootNode = new FiberRootNode(container, hostRootFiber);
    hostRootFiber.updateQueue = createUpdateQueue();
    return fiberRootNode;
}

type Container = PackagedElement | Document;


/**
 * 创建更新
 * @param {Action<State>} action
 * @returns {Update<State>}
 */
const createUpdate = <State>(action: State) => {
    return {
        action,
    };
};

/**
 * 更新update
 * @param {UpdateQueue<Action>} updateQueue
 * @param {Update<Action>} update
 */
const enqueueUpdate = <State>(
    updateQueue: UpdateQueue<State>,
    update: Update<State>
) => {
    updateQueue.shared.pending = update;
};


/**
 * ReactDOM.createRoot().render 中调用更新
 * 1. 创建update, 并将其推到enqueueUpdate中
 */
function updateContainer(
    element: ReactElement | null,
    root: FiberRootNode
) {
    const hostRootFiber = root.current;
    const update = createUpdate<ReactElement | null>(element);
    enqueueUpdate(
        hostRootFiber.updateQueue as UpdateQueue<ReactElement | null>,
        update
    );
    // 插入更新后，进入调度
    scheduleUpdateOnFiber(hostRootFiber);
    return element;
}

// 从当前触发更新的fiber向上遍历到根节点fiber hostRootFiber
function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }
    if (node.tag === HostRoot) {
        return node.stateNode;
    }
    return null;
}


export const createWorkInProgress = (
    current: FiberNode,
    pendingProps: Props
): FiberNode => {
    debugger
    // 在这里 UI FIberNode 和 WorkInProgress 相互替换
    let wip = current/* UI FiberNode */.alternate; // 协调中的FiberNode、协调过的FiberNode

    // 没有协调中或协调过的FiberNode，则新建FiberNode
    if (wip === null) {
        //mount
        wip = new FiberNode(current.tag, pendingProps, current.key);
        // stateNode可能是FiberRootNode current是HostRootFiber
        // 也可能是DOM Element current是其他
        wip.stateNode = current.stateNode;

        wip.alternate = current;
        current.alternate = wip;
        wip._UI_OR_WIP = 'WIP'
        wip.alternate._UI_OR_WIP = 'UI'
    } else {
        wip._UI_OR_WIP = 'WIP'
        if (wip.alternate) {
            wip.alternate._UI_OR_WIP = 'UI'
        }
        // wip有值，则不重新创建，清理掉一下状态，重新生成FiberNode tree
        //update
        wip.pendingProps = pendingProps;
        // 清掉副作用（上一次更新遗留下来的）
        wip.flags = NoFlags;
        wip.subtreeFlags = NoFlags;
    }

    wip.type = current.type;
    wip.updateQueue = current.updateQueue;
    wip.child = current.child;
    wip.memoizedProps = current.memoizedProps;
    wip.memoizedState = current.memoizedState;
    return wip;
};

function prepareFreshStack(root: FiberRootNode) {
    // createWorkInProgress return HostRootFiber
    workInProgress = createWorkInProgress(root.current/* HostRootFiber */, {});
}

// wookLoop的入口，也是调和完成后，将生成的fiberNode树，赋值给finishedWork，进入commit的入口
function renderRoot(root: FiberRootNode) {
    // 初始化，将workInProgress 指向第一个fiberNode HostRootFiber
    prepareFreshStack(root);
    do {
        try {
            workLoop();
            break;
        } catch (e) {
            if (__DEV__) {
                console.warn("workLoop发生错误", e);
            }
            workInProgress = null;
        }
    } while (true);

    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;

    // wip fiberNode树  树中的flags执行对应的操作
    commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork;

    if (finishedWork === null) {
        return;
    }
    if (__DEV__) {
        console.log('开始commit阶段', finishedWork);
    }
    // 重置
    root.finishedWork = null;

    const subtreeHasEffect =
        (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

    if (subtreeHasEffect || rootHasEffect) {
        // 有副作用要执行

        // 阶段1/3:beforeMutation

        // 阶段2/3:Mutation
        commitMutationEffects(finishedWork);

        // Fiber Tree切换
        root.current = finishedWork;

        // 阶段3:Layout
    } else {
        // Fiber Tree切换
        root.current = finishedWork;
    }
}

let nextEffect: FiberNode | null = null;

function getHostParent(fiber: FiberNode) {
    let parent = fiber.return;

    while (parent) {
        const parentTag = parent.tag;
        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        }
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }
        parent = parent.return;
    }
    console.error('getHostParent未找到hostParent');
}

/**
 * 难点在于目标fiber的hostSibling可能并不是他的同级sibling
 * 比如： <A/><B/> 其中：function B() {return <div/>} 所以A的hostSibling实际是B的child
 * 实际情况层级可能更深
 * 同时：一个fiber被标记Placement，那他就是不稳定的（他对应的DOM在本次commit阶段会移动），也不能作为hostSibling
 */
function gethostSibling(fiber: FiberNode) {
    let node: FiberNode = fiber;
    findSibling: while (true) {
        while (node.sibling === null) {
            // 如果当前节点没有sibling，则找他父级sibling
            const parent = node.return;
            if (
                parent === null ||
                parent.tag === HostComponent ||
                parent.tag === HostRoot
            ) {
                // 没找到
                return null;
            }
            node = parent;
        }
        node.sibling.return = node.return;
        // 向同级sibling寻找
        node = node.sibling;

        while (node.tag !== HostText && node.tag !== HostComponent) {
            // 找到一个非Host fiber，向下找，直到找到第一个Host子孙
            if ((node.flags & Placement) !== NoFlags) {
                // 这个fiber不稳定，不能用
                continue findSibling;
            }
            if (node.child === null) {
                continue findSibling;
            } else {
                node.child.return = node;
                node = node.child;
            }
        }

        // 找到最有可能的fiber
        if ((node.flags & Placement) === NoFlags) {
            // 这是稳定的fiber，就他了
            return node.stateNode;
        }
    }
}

function insertOrAppendPlacementNodeIntoContainer(
    fiber: FiberNode,
    parent: Container,
    before?: Instance
) {
    if (fiber.tag === HostComponent || fiber.tag === HostText) {
        if (before) {
            insertChildToContainer(fiber.stateNode, parent, before);
        } else {
            appendChildToContainer(fiber.stateNode, parent);
        }
        return;
    }
    const child = fiber.child;
    if (child !== null) {
        insertOrAppendPlacementNodeIntoContainer(child, parent, before);
        let sibling = child.sibling;

        while (sibling !== null) {
            insertOrAppendPlacementNodeIntoContainer(sibling, parent, before);
            sibling = sibling.sibling;
        }
    }
}

const commitPlacement = (finishedWork: FiberNode) => {
    if (__DEV__) {
        console.log('插入、移动DOM', finishedWork);
    }
    const hostParent = getHostParent(finishedWork) as Container;

    const sibling = gethostSibling(finishedWork);

    // appendChild / insertBefore
    insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
};

function commitNestedUnmounts(
    root: FiberNode,
    onCommitUnmount: (unmountFiber: FiberNode) => void
) {
    let node = root;

    while (true) {
        onCommitUnmount(node);

        if (node.child !== null) {
            // 向下
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === root) {
            // 终止条件
            return;
        }
        while (node.sibling === null) {
            // 向上
            if (node.return === null || node.return === root) {
                // 终止条件
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

/**
 * 删除需要考虑：
 * HostComponent：需要遍历他的子树，为后续解绑ref创造条件，HostComponent本身只需删除最上层节点即可
 * FunctionComponent：effect相关hook的执行，并遍历子树
 */
function commitDeletion(childToDelete: FiberNode) {
    if (__DEV__) {
        console.log('删除DOM、组件unmount', childToDelete);
    }
    let firstHostFiber: FiberNode;

    commitNestedUnmounts(childToDelete, (unmountFiber) => {
        switch (unmountFiber.tag) {
            case HostComponent:
                if (!firstHostFiber) {
                    firstHostFiber = unmountFiber;
                }
                // 解绑ref
                return;
            case HostText:
                if (!firstHostFiber) {
                    firstHostFiber = unmountFiber;
                }
                return;
            case FunctionComponent:
                // effect相关操作
                return;
        }
    });

    // @ts-ignore
    if (firstHostFiber) {
        const hostParent = getHostParent(childToDelete) as Container;
        removeChild(firstHostFiber.stateNode, hostParent);
    }

    childToDelete.return = null;
    childToDelete.child = null;
}

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
    const flags = finishedWork.flags;

    if ((flags & Placement) !== NoFlags) {
        // 插入/移动
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
    if ((flags & ChildDeletion) !== NoFlags) {
        const deletions = finishedWork.deletions;

        if (deletions !== null) {
            deletions.forEach((childToDelete) => {
                commitDeletion(childToDelete);
            });
        }
        finishedWork.flags &= ~ChildDeletion;
    }
    if ((flags & Update) !== NoFlags) {
        commitUpdate(finishedWork);
        finishedWork.flags &= ~Update;
    }
};



function commitUpdate(finishedWork: FiberNode) {
	if (__DEV__) {
		console.log('更新DOM、文本节点内容', finishedWork);
	}
	switch (finishedWork.tag) {
		case HostText:
			const newContent = finishedWork.pendingProps.content;
			return commitTextUpdate(finishedWork.stateNode, newContent);
	}
	console.error('commitUpdate未支持的类型', finishedWork);
}

const commitMutationEffects = (finishedWork: FiberNode) => {
    nextEffect = finishedWork;

    while (nextEffect !== null) {
        // 向下遍历
        const child: FiberNode | null = nextEffect.child;

        if (
            (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
            child !== null
        ) {
            nextEffect = child;
        } else {
            // 向上遍历
            up: while (nextEffect !== null) {
                commitMutationEffectsOnFiber(nextEffect);
                const sibling: FiberNode | null = nextEffect.sibling;

                if (sibling !== null) {
                    nextEffect = sibling;
                    break up;
                }
                nextEffect = nextEffect.return;
            }
        }
    }
};

function workLoop() {
    // 最开始workInProgress是HostRootFiber
    // 从根开始处理
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(fiber: FiberNode): void {
    const next = beginWork(fiber); // next 是fiber的子fiber 或者 是null
    // 工作完成，需要将pendingProps 复制给 已经渲染的props
    fiber.memoizedProps = fiber.pendingProps;

    if (next === null) {
        // 没有子fiber
        completeUnitOfWork(fiber);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber;

    do {
        const next = completeWork(node);

        if (next !== null) {
            workInProgress = next;
            return;
        }

        const sibling = node.sibling;
        if (sibling) {
            workInProgress = sibling;
            return;
        }
        node = node.return;
        workInProgress = node;
    } while (node !== null);
}

function getEventCallbackNameFromtEventType(
    eventType: string
): string[] | undefined {
    return {
        click: ['onClickCapture', 'onClick']
    }[eventType];
}

const updateFiberProps = (
    node: Element,
    props: any
): PackagedElement => {
    (node as PackagedElement)[elementEventPropsKey] =
        (node as PackagedElement)[elementEventPropsKey] || {};

    validEventTypeList.forEach((eventType) => {
        const callbackNameList = getEventCallbackNameFromtEventType(eventType);

        if (!callbackNameList) {
            return;
        }
        callbackNameList.forEach((callbackName) => {
            if (Object.hasOwnProperty.call(props, callbackName)) {
                (node as PackagedElement)[elementEventPropsKey][callbackName] =
                    props[callbackName];
            }
        });
    });
    return node as PackagedElement;
};

const createInstance = (type: string, props: any): Instance => {
    const element = document.createElement(type);
    return updateFiberProps(element, props);
};

const insertChildToContainer = (
    child: Instance,
    container: Container,
    before: Instance
) => {
    container.insertBefore(before, child);
};

const appendInitialChild = (parent: Instance, child: Instance) => {
    parent.appendChild(child);
};

const appendChildToContainer = (
    child: Instance,
    container: Container
) => {
    container.appendChild(child);
};

const commitTextUpdate = (
	textIntance: TextInstance,
	content: string
) => {
	textIntance.nodeValue = content;
};

const removeChild = (child: Instance, container: Container) => {
	container.removeChild(child);
};

const createTextInstance = (content: string) => {
    return document.createTextNode(content);
};

const appendAllChildren = (parent: Instance, workInProgress: FiberNode) => {
    // 遍历workInProgress所有子孙 DOM元素，依次挂载
    let node = workInProgress.child;
    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
        } else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }

        if (node === workInProgress) {
            return;
        }

        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress /* 遍历父亲找到直系 */) {
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
};

const bubbleProperties = (completeWork: FiberNode) => {
    let subtreeFlags = NoFlags;
    let child = completeWork.child;
    while (child !== null) {
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        child.return = completeWork;
        child = child.sibling;
    }
    completeWork.subtreeFlags |= subtreeFlags;
};

function markUpdate(fiber: FiberNode) {
    fiber.flags |= Update;
}

const completeWork = (workInProgress: FiberNode) => {
    if (__DEV__) {
        console.log('complete流程', workInProgress.type);
    }
    const newProps = workInProgress.pendingProps;
    const current = workInProgress.alternate;

    switch (workInProgress.tag) {
        case HostComponent:
            if (current !== null && workInProgress.stateNode) {
                // 更新
                // TODO 更新元素属性
                // 不应该在此处调用updateFiberProps，应该跟着判断属性变化的逻辑，在这里打flag
                // 再在commitWork中更新fiberProps，我准备把这个过程留到「属性变化」相关需求一起做
                updateFiberProps(workInProgress.stateNode, newProps);
            } else {
                // 初始化DOM
                const instance = createInstance(workInProgress.type, newProps);
                // 挂载DOM
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;

                // TODO 初始化元素属性
            }
            // 冒泡flag
            bubbleProperties(workInProgress);
            return null;
        case HostRoot:
            bubbleProperties(workInProgress);
            return null;
        case HostText:
            if (current !== null && workInProgress.stateNode) {
                // 更新
                const oldText = current.memoizedProps?.content;
                const newText = newProps.content;
                if (oldText !== newText) {
                    markUpdate(workInProgress);
                }
            } else {
                // 初始化DOM
                const textInstance = createTextInstance(newProps.content);
                workInProgress.stateNode = textInstance;
            }

            // 冒泡flag
            bubbleProperties(workInProgress);
            return null;
        case FunctionComponent:
            bubbleProperties(workInProgress);
            return null;
        default:
            console.error('completeWork未定义的fiber.tag', workInProgress);
            return null;
    }
};

/**
 * 递归中的递阶段
 * 比较 然后返回子fiberNode 或者null
 */
export const beginWork = (wip: FiberNode) => {
    switch (wip.tag) {
        case HostRoot:
            return updateHostRoot(wip);
        case HostComponent:
            return updateHostComponent(wip);
        case HostText:
            // 文本节点没有子节点，所以没有流程
            return null;
        default:
            if (__DEV__) {
                console.warn("beginWork未实现的类型");
            }
            break;
    }
    return null;
};

const processUpdateQueue = <State>(
    baseState: State,
    updateQueue: UpdateQueue<State>,
    fiber: FiberNode
): State => {
    if (updateQueue !== null) {
        const pending = updateQueue.shared.pending;
        const pendingUpdate = pending;
        updateQueue.shared.pending = null;

        if (pendingUpdate !== null) {
            const action = pendingUpdate.action;
            if (action instanceof Function) {
                baseState = action(baseState);
            } else {
                baseState = action;
            }
        }
    } else {
        console.error(fiber, 'processUpdateQueue时 updateQueue不存在');
    }
    return baseState;
};

/**
  processUpdateQueue： 是根据不同的类型（函数和其他）生成memoizedState
*/
function updateHostRoot(wip: FiberNode) {
    const baseState = wip.memoizedState;
    const updateQueue = wip.updateQueue as UpdateQueue<Element>;
    const memoizedState = processUpdateQueue(baseState, updateQueue, wip); // 最新状态
    wip.memoizedState = memoizedState; // 其实就是传入的element <App />

    const nextChildren = wip.memoizedState; // 就是我们传入的ReactElement 对象
    reconcileChildren(wip /* 正在协调的FiberNode */, nextChildren /* 新的孩子 */);
    return wip.child;
}

function updateHostComponent(workInProgress: FiberNode) {
    // 根据element创建fiberNode
    const nextProps = workInProgress.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

/**
 * 
 * @param workInProgress 正在协调的FiberNode
 * @param children 新的孩子
 */
function reconcileChildren(workInProgress: FiberNode /* 正在协调的FiberNode */, children?: ReactElement /* 新的孩子 */) {
    const current = workInProgress.alternate;

    if (current !== null) {
        // update
        workInProgress.child = reconcileChildFibers(
            workInProgress,
            current.child,
            children
        );
    } else {
        // mount
        workInProgress.child = mountChildFibers(workInProgress, null, children);
    }
}

const reconcileChildFibers = ChildReconciler(true);
const mountChildFibers = ChildReconciler(false);

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;

    return clone;
}

function ChildReconciler(shouldTrackEffects: boolean) {
    function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
        if (!shouldTrackEffects) {
            return;
        }
        const deletions = returnFiber.deletions;
        if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
        } else {
            deletions.push(childToDelete);
        }
    }
    function deleteRemainingChildren(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null
    ) {
        if (!shouldTrackEffects) {
            return;
        }
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
    }
    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        element: ReactElement
    ) {
        // 前：abc 后：a  删除bc
        // 前：a 后：b 删除b、创建a
        // 前：无 后：a 创建a
        const key = element.key;
        let current = currentFirstChild;

        while (current !== null) {
            if (current.key === key) {
                // key相同，比较type

                if (element.$$typeof === REACT_ELEMENT_TYPE) {
                    if (current.type === element.type) {
                        // type相同 可以复用
                        const existing = useFiber(current, element.props);
                        existing.return = returnFiber;
                        // 当前节点可复用，其他兄弟节点都删除
                        deleteRemainingChildren(returnFiber, current.sibling);
                        return existing;
                    }
                    // key相同但type不同，没法复用。后面的兄弟节点也没有复用的可能性了，都删除
                    deleteRemainingChildren(returnFiber, current);
                    break;
                } else {
                    console.error('未定义的element.$$typeof', element.$$typeof);
                    break;
                }
            } else {
                // key不同，删除旧的，继续比较
                deleteChild(returnFiber, current);
                current = current.sibling;
            }
        }
        // 创建新的
        // 根据新的 孩子ReactElement创建新的 FIberNode
        const fiber = createFiberFromElement(element);
        // 设置新的FiberNode的父亲节点
        fiber.return = returnFiber;
        return fiber;
    }

    function createFiberFromElement(element: ReactElement): FiberNode {
        const { type, key, props } = element;
        let fiberTag: WorkType = FunctionComponent;

        if (typeof type === 'string') {
            fiberTag = HostComponent;
        } else if (typeof type !== 'function') {
            console.error('未定义的type类型', element);
        }
        const fiber = new FiberNode(fiberTag, props, key);
        fiber.type = type;

        return fiber;
    }

    function placeSingleChild(fiber: FiberNode) {
        if (shouldTrackEffects && fiber.alternate === null) {
            fiber.flags |= Placement;
        }
        return fiber;
    }

    function updateFromMap(
        returnFiber: FiberNode,
        existingChildren: ExistingChildren,
        index: number,
        element: ReactElement | string
    ): FiberNode | null {
        let keyToUse;
        if (typeof element === 'string') {
            keyToUse = index;
        } else {
            keyToUse = element.key !== null ? element.key : index;
        }
        const before = existingChildren.get(keyToUse);

        if (typeof element === 'string') {
            if (before) {
                // fiber key相同，如果type也相同，则可复用
                existingChildren.delete(keyToUse);
                if (before.tag === HostText) {
                    // 复用文本节点
                    return useFiber(before, { content: element });
                } else {
                    deleteChild(returnFiber, before);
                }
            }
            // 新建文本节点
            return new FiberNode(HostText, { content: element }, null);
        }
        if (typeof element === 'object' && element !== null) {
            switch (element.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    if (before) {
                        // fiber key相同，如果type也相同，则可复用
                        existingChildren.delete(keyToUse);
                        if (before.type === element.type) {
                            // 复用
                            return useFiber(before, element.props);
                        } else {
                            deleteChild(returnFiber, before);
                        }
                    }
                    return createFiberFromElement(element);
            }
        }
        console.error('updateFromMap未处理的情况', before, element);
        return null;
    }

    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        content: string
    ) {
        // 前：b 后：a
        // TODO 前：abc 后：a
        // TODO 前：bca 后：a
        let current = currentFirstChild;
        while (current !== null) {
            if (current.tag === HostText) {
                // 可以复用
                const existing = useFiber(current, { content });
                existing.return = returnFiber;
                deleteRemainingChildren(returnFiber, current.sibling);
                return existing;
            }
            // 不能复用
            deleteChild(returnFiber, current);
            current = current.sibling;
        }

        const created = new FiberNode(HostText, { content }, null);
        created.return = returnFiber;
        return created;
    }

    function reconcileChildrenArray(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        newChild: (ReactElement | string)[]
    ) {
        // 遍历到的最后一个可复用fiber在before中的index
        let lastPlacedIndex = 0;
        // 创建的最后一个fiber
        let lastNewFiber: FiberNode | null = null;
        // 创建的第一个fiber
        let firstNewFiber: FiberNode | null = null;

        // 遍历前的准备工作，将current保存在map中
        const existingChildren: ExistingChildren = new Map();
        let current = currentFirstChild;
        while (current !== null) {
            const keyToUse = current.key !== null ? current.key : current.index;
            existingChildren.set(keyToUse, current);
            current = current.sibling;
        }

        // 遍历流程
        for (let i = 0; i < newChild.length; i++) {
            const after = newChild[i];

            // after对应的fiber，可能来自于复用，也可能是新建
            const newFiber = updateFromMap(
                returnFiber,
                existingChildren,
                i,
                after
            ) as FiberNode;

            newFiber.index = i;
            newFiber.return = returnFiber;

            if (lastNewFiber === null) {
                lastNewFiber = firstNewFiber = newFiber;
            } else {
                lastNewFiber = (lastNewFiber.sibling as FiberNode) = newFiber;
            }

            if (!shouldTrackEffects) {
                continue;
            }
            const current = newFiber.alternate;
            if (current !== null) {
                const oldIndex = current.index;
                if (oldIndex < lastPlacedIndex) {
                    // 移动
                    newFiber.flags |= Placement;
                    continue;
                } else {
                    // 不移动
                    lastPlacedIndex = oldIndex;
                }
            } else {
                // fiber不能复用，插入新节点
                newFiber.flags |= Placement;
            }
        }

        // 遍历后的收尾工作，标记existingChildren中剩余的删除
        existingChildren.forEach((fiber) => {
            deleteChild(returnFiber, fiber);
        });
        return firstNewFiber;
    }

    /**
     * 
     * @param returnFiber 正在协调的FIberNode
     * @param currentFirstChild 旧的孩子
     * @param newChild 新的孩子
     * @returns 
     */
    function reconcileChildFibers(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        newChild?: ReactElement
    ): FiberNode | null {
        // newChild 为 JSX
        // currentFirstChild 为 fiberNode
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(
                        reconcileSingleElement(returnFiber, currentFirstChild, newChild)
                    );
            }

            if (Array.isArray(newChild)) {
                return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
            }
        }
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + '')
            );
        }

        console.error('reconcile时未实现的child 类型', newChild, currentFirstChild);
        return null;
    }

    return reconcileChildFibers;
}



function scheduleUpdateOnFiber(fiber: FiberNode) {
    let root = markUpdateFromFiberToRoot(fiber);
    renderRoot(root);
}

export function createRoot(container: Container) {
    const root = createContainer(container);

    return {
        render(element: ReactElement) {
            updateContainer(element, root);
        },
    };
}
