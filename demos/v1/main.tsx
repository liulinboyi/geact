import React from 'geact'

function App() {

  return (
    <div>
      <span>hello,</span>
      <span>geact</span>
    </div>
  )
}



console.log(React)
const element = document.querySelector("#root")
React.createRoot(element).render(App)
