import React from 'react';
import PropTypes from 'prop-types';
import quote from '../../lib/quote'
import nrdbQuery from '../../lib/nrdb-query'

import ContainerExplorer from './container-explorer'
import Header from './header'

export default class ContainerExplorerNerdlet extends React.Component {
  static propTypes = {
    nerdletUrlState: PropTypes.object,
    launcherUrlState: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
  };

  constructor(props) {
    super(props)

    this.addFilter = this.addFilter.bind(this)
    this.removeFilter = this.removeFilter.bind(this)

    // TODO add an account picker
    this.state = {
      account: { id: 686435, name: "Container Fabric" },
      filters: []
    }    
  }

  async componentDidMount() {
    const counts = await this.countProcesses()
    await this.setState({counts})
    
    // FIXME remove
    // await this.addFilter("containerImageName", "cf-registry.nr-ops.net/apm/rpm-ui:release-1785")
  }

  async addFilter(name, value) {
    const {filters} = this.state
    filters.push({name, value})
    await this.setFilters(filters)
  }

  async removeFilter(name, value) {
    let {filters} = this.state
    
    filters = filters.filter(f => !(f.name == name && f.value == value))
    this.setFilters(filters)
  }

  async setFilters(filters) {
    let where = null
    if(filters != null && filters.length > 0) {
      where = filters.map(({name, value}) => `${quote(name)} = '${value}'`).join(" AND ")
    }

    const counts = await this.countProcesses(where)
    await this.setState({filters, where, counts})
}

  async countProcesses(where) {
    this.setState({counts: null})
    const timeWindow = "SINCE 30 seconds ago"
    const {account} = this.state
    const whereClause = where ? `WHERE ${where}` : ""
    const select = `uniqueCount(entityAndPid) as processes, uniqueCount(entityGuid) as hosts, uniqueCount(containerId) AS containers`
    const nrql = `SELECT ${select} FROM ProcessSample ${whereClause} ${timeWindow}`
    const counts = (await nrdbQuery(account.id, nrql))[0]
    return counts
  }

  render() {
    const { filters, counts } = this.state
    if(!counts) return <div/>

    return <div>
      <Header counts={counts} filters={filters} showFacetPicker={this.showFacetPicker} removeFilter={this.removeFilter}/>
      <ContainerExplorer {...this.state} addFilter={this.addFilter}/>
    </div>
  }
}
