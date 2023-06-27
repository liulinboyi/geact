import { Key, Props, Ref } from "./jsx"

// FiberNode Tag
const FunctionComponent = 0
const HostRoot = 3 // 项目挂载的根节点 React.render() 挂载的根节点挂载的FiberNode对应类型
const HostComponent = 5 // 这个<div>对应的FiberNode类型就是HostComponent
const HostText = 6 // 这个<div>123</div>中123对应的FiberNode类型就是HostText
type WorkType = typeof FunctionComponent | typeof HostRoot | typeof HostComponent | typeof HostText

class FiberNode {
    tag!: WorkType
    pendingProps!: Props
    memoizedProps!: Props | null
    key!: Key
    type: any
    stateNode: any
    return!: FiberNode | null
    sibling!: FiberNode | null
    children!: any
    index!: number
    ref: Ref

    alternate!: FiberNode | null // 方便workInProgress与current之间切换 比如 当前FiberNode是workInProgress，则alternate就是current

    contructor(tag: WorkType, pendingProps: Props /* 当前FiberNode接下来有哪些Props需要改变 */, key: Key) {
        // 实例的属性
        this.tag = tag
        this.key = key
        this.stateNode = null // 比如这个FiberNode是<div>的话，这个属性就保存的div这个DOM Element
        this.type = null // 类型 比如对于一个FunctionComponent类型来说， type就是函数组件本身

        // 构成树状结构
        // fiberNode 除了 作为一个实例，还需要做一些字段用来表示节点之间的关系
        this.return = null // 指向父FiberNode
        this.sibling = null // 指向当前FiberNode 右边的兄弟FiberNode
        this.children = null // 指向当前FiberNode的孩子FiberNode
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
