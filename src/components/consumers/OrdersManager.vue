<template>
  <div>
    <div id="table">
      <Table border :columns="columns" :data="plugins">
        <template slot-scope="{ row }" slot="name">
          <strong>{{ row.name }}</strong>
        </template>
        <template slot-scope="{ row }" slot="action">
          <Button type="primary" v-if="row.name==='my-count'" size="small" style="margin-right: 5px"
                  @click="onClickRecharge(row)">
            {{ $t('common.recharge') }}
          </Button>
          <Button type="primary" v-if="row.name==='my-rate-limit'" size="small" style="margin-right: 5px"
                  @click="edit(row.id)">{{ $t('common.view') }}
          </Button>
          <Button type="error" size="small" @click="deleteDialog(row.id)">{{ $t('common.delete') }}</Button>
        </template>
      </Table>
    </div>
    <RechargeModal
        v-bind:visible="visible"
        v-bind:order-info="orderInfo"
        v-bind:on-ok="asyncOK"
        v-bind:on-cancel="cancelHandle"
    />
  </div>
</template>

<script>
import EventBus from 'src/event-bus'
import RechargeModal from "./RechargeModal";
import moment from "moment";

export default {
  name: "OrdersManager",
  components: {RechargeModal},
  props: ['plugins'],
  data() {
    return {
      columns: [
        {
          title: 'service',
          key: 'service',
          width: 160,
          render: function (h, params) {
            if (params.row) {
              const name = params.row.service.name
              const id = params.row.service.id
              return h('div', [h('p', name), <br/>, h('router-link', {props: {to: '/services/' + id}}, id)])
            }

          }
        },
        {
          title: 'plug-name',
          key: 'name',
          width: 160,
          render: function (h, params) {
            if (params.row) {
              const name = params.row.name
              const id = params.row.id
              return h('div', [h('p', name), <br/>, h('router-link', {props: {to: '/plugins/edit/' + id}}, id)])
            }

          }
        },
        // {
        //   title: 'consumer',
        //   render: function (h, params) {
        //     if (params.row.consumer) {
        //       return h('router-link', {props: {to: '/consumers/edit/' + params.row.consumer.id}}, params.row.consumer.id);
        //     }
        //     return h();
        //   }
        //
        // },
        {
          title: 'balance/usage',
          key: 'usage',
          width: 150,
          render: function (h, params) {
            let usage = params.row.usage
            console.log('params.row》》', params.row)
            let period = null
            let isFirst = false
            let limit_config = params.row.config || {}
            if (params.row.name === "my-rate-limit") {

              const limit = limit_config.limit
              const start_timestamp = limit_config.start_time
              period = limit.period
              let count = limit.count

              const start_date = moment(moment.unix(start_timestamp / 1000))
              // console.log('start_date>>',start_date,period,moment(moment().unix()))
              if (start_date.isSame(moment().utc(), period)) {
                isFirst = true
                const base = period === 'month' ? 30 : 365
                count = Math.floor((base - start_date.get('date') + 1) * count / base)
              }

              usage = count - usage
            }

            // const id = params.row.service.id
            console.log('limit_config.unit?>', limit_config.unit)
            return h('div', [h('p', isFirst ? 'First' + ' ' + period : usage),
              <br/>, h('p', `${usage / (period ? 1 : limit_config.unit)} ${period ? ' /' + period : 'times'}`)])
          }
        },
        {
          title: 'type',
          key: 'type',
          width: 150,
          render: function (h, params) {
            const config = params.row.config
            // const id = params.row.service.id
            let type = config && config.type
            if (config.limit) {
              type = 'period'
            }
            return h('span', type)
          }
        },
        {
          title: 'created_at',
          key: 'createAtStr',
          width: 150
        },
        {
          title: 'enabled',
          key: 'enabled',
          width: 90,
          render: function (h, params) {
            return h('i-switch', {props: {value: params.row.enabled, disabled: true}})
          }
        }, {
          title: 'period',
          key: 'start_time',
          width: 150,
          render: function (h, params) {
            const start_timestamp = params.row.config.start_time
            const end_timestamp = params.row.config.end_time
            if (start_timestamp) {
              let start_time = moment.unix(start_timestamp / 1000).format('YYYY-MM-DD HH:mm:ss');
              let end_time = moment.unix(end_timestamp / 1000).format('YYYY-MM-DD HH:mm:ss');
              return h('div', [h('p', start_time), <br/>, h('p', end_time)])
            } else {
              return null
            }

          }
        },

        {
          title: this.$t('common.action'),
          slot: 'action',
          fixed: 'right',
          width: 150,
          align: 'center'
        }
      ],
      visible: false,
      // loading: true,
      orderInfo: null,
    }
  },
  methods: {
    edit(pluginId) {
      this.$router.push({path: `/plugins/edit/${pluginId}`});
    },
    deleteDialog(pluginId) {
      let _this = this;
      this.$Modal.confirm({
        title: 'Delete Plugin',
        content: '<p>Are you sure you would like to delete</p>' + '<p style="font-weight: bold">' + pluginId + '</p>',
        onOk: () => {
          _this._delete('/plugins/' + pluginId, () => {
            _this.$Message.info('Plugin deleted!');
            EventBus.$emit('pluginChange', {pluginId: pluginId});
          });
        },
        onCancel: () => {


        }
      });
    },
    onClickRecharge(row) {
      this.visible = true
      this.orderInfo = row
    },
    asyncOK(row, values) {
      const {consumer, service} = row
      this._post(`/consumers/${consumer.id}/my-count/${service.id}/usage/times`, {
        value: values.input
      }, res => {
        if (res.status === 200) {
          this.$Message.success('Recharge success!');
        } else {
          this.$Message.error('Recharge Failed!');
        }
      })
    },
    cancelHandle() {
      this.visible = false
    }
  }
}
</script>

<style scoped>

</style>
