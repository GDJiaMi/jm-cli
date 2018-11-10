import React from 'react'
import ReactDOM from 'react-dom'
import { log } from '~/utils/common'
import '~/css/a.css'

class H extends React.Component<{}, {}> {
  public componentDidMount() {
    log('hi')
  }
  public render() {
    return <div>hello</div>
  }
}

ReactDOM.render(<H />, document.body)
