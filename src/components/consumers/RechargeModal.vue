<template>
  <Modal
      v-model="visible"
      title="Recharge"
      :loading="loading"
      :order-info="orderInfo"
      :closable="false"
      :mask-closable="false"
      @on-ok="asyncOK"
      @on-cancel="onCancel"
  >
    <p><span>订阅类型：</span>{{ orderInfo && orderInfo.type }}.</p>
    <Form :model="formItem" :label-width="80" @submit.native.prevent>
      <FormItem label="Recharge Value">
        <Input v-model="formItem.input" placeholder="Enter something..." type="number"></Input>
      </FormItem>
      <!--      <FormItem label="Select">-->
      <!--        <Select v-model="formItem.select">-->
      <!--          <Option value="beijing">New York</Option>-->
      <!--          <Option value="shanghai">London</Option>-->
      <!--          <Option value="shenzhen">Sydney</Option>-->
      <!--        </Select>-->
      <!--      </FormItem>-->
      <!--      <FormItem>-->
      <!--        <Button type="primary">Submit</Button>-->
      <!--        <Button style="margin-left: 8px">Cancel</Button>-->
      <!--      </FormItem>-->
    </Form>
  </Modal>
</template>

<script>
export default {
  name: "RechargeModal",
  props: ['visible', 'orderInfo', 'onOk',"onCancel"],
  data() {
    return {
      loading: true,
      formItem: {
        input: '',
      }
    }
  },
  methods: {
    asyncOK() {
      // const {consumer,service}=this.orderInfo
      this.onOk(this.orderInfo, this.formItem)
      this.loading = false
    }
  }
}
</script>



