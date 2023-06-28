import React from 'geact'

let msg = "geact"

function App() {

  return (
    <div>
      <span>hello,</span>
      <span>{ msg }</span>
    </div>
  )
}



console.log(React)
const element = document.querySelector("#root")
const update = React.createRoot(element).render(App)
update()

function Update (args: string) {
  msg = args
  update()
}

// @ts-ignore
window.Update = Update
