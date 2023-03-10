<template>
  <div>
    <Breadcrumb>
      <BreadcrumbItem to="/">Home</BreadcrumbItem>
      <BreadcrumbItem to="/plugins">Plugin</BreadcrumbItem>
      <BreadcrumbItem v-if="!pluginId">Add Plugin</BreadcrumbItem>
      <BreadcrumbItem v-else>{{ pluginId }}</BreadcrumbItem>
    </Breadcrumb>

    <Form :model="formItem" :label-width="140" style="margin-top: 20px">
      <FormItem label="name:">
        <Select v-model="formItem.name" filterable class="text_input">
          <Option v-for="item in enabledPlugins" :value="item" :key="item">{{ item }}</Option>
        </Select>
        <span class="field_desc"><a href="https://docs.konghq.com/hub/"
                                    target="_blank">Plugin's document</a></span>
      </FormItem>

      <FormItem label="service:">
        <Select v-model="serviceId" filterable class="text_input_multiple" ref="service" clearable>
          <Option v-for="item in services" :value="item.id" :key="item.id">{{ item.id + ' ' + item.name }}</Option>
        </Select>
        <span class="field_desc">If this plugin no need assign to a service,leave it blank.</span>
      </FormItem>

      <FormItem label="route:">
        <Select v-model="formItem.route.id" filterable class="text_input_multiple" clearable>
          <Option v-for="item in routes" :value="item.id" :key="item.id">{{ item.name + '(' + item.paths[0] + ')' }}
          </Option>
        </Select>
        <span class="field_desc">If this plugin no need assign to a route,leave it blank.</span>
      </FormItem>


      <FormItem label="consumer:">
        <Select v-model="formItem.consumer.id" filterable class="text_input_multiple" clearable>
          <Option v-for="item in consumers" :value="item.id" :key="item.id">
            {{ item.id + ' ' + item.username + ' ' + item.custom_id }}
          </Option>
        </Select>
        <span class="field_desc">If this plugin no need assign to a consumer,leave it blank.</span>
      </FormItem>

      <FormItem label="run_on:" v-if="!isKong2()">
        <Select v-model="formItem.run_on" filterable class="text_input">
          <Option v-for="item in runOns" :value="item" :key="item">
            {{ item }}
          </Option>
        </Select>
        <span
            class="field_desc">Control on which Kong nodes this plugin will run, given a Service Mesh scenario. </span>
      </FormItem>

      <FormItem label="enable:">
        <i-switch v-model="formItem.enabled" size="large">
          <span slot="open">true</span>
          <span slot="close">false</span>
        </i-switch>
        <span class="field_desc">Whether the plugin is applied.</span>
      </FormItem>


      <FormItem :label-width="300" v-for="field in flatFields" :label="field.fieldName+':'"
                :key="field.fieldName">

        <DatePicker v-if="field.fieldName==='config.start_time'" placeholder="Select date and time"
                    :value="field.defaultValue&&new Date(field.defaultValue)||new Date()"
                    style="width: 200px"
                    :confirm="true"
                    @on-change="valueChange($event,field)"
        ></DatePicker>

        <DatePicker v-if="field.fieldName==='config.end_time'" placeholder="Select date and time"
                    :value="field.defaultValue&&new Date(field.defaultValue)"
                    style="width: 200px"
                    :confirm="true"
                    :editable="true"
                    @on-change="valueChange($event,field)"
        ></DatePicker>

        <Select v-if="field.elementType==='select'" :name="field.fieldName" class="text_input"
                @on-change="valueChange($event,field)"
                :value="field.defaultValue"

        >
          <Option v-for="value in field.selectValues" :value="value" :key="value">{{ value }}</Option>
        </Select>

        <Input v-if="field.fieldType==='string'&&field.elementType!=='select'" :name="field.fieldName"
               class="text_input"
               @input="valueChange($event,field)"
               :value="field.defaultValue">

        </Input>
        <Input v-if="field.fieldType==='array'&&field.elementType==='string'" :name="field.fieldName"
               @input="valueChange($event,field)" placeholder="Split by comma"
               class="text_input" :value="field.defaultValue"></Input>

        <Input v-if="field.fieldType==='set'&&field.elementType==='string'" :name="field.fieldName"
               @input="valueChange($event,field)" placeholder="Split by comma"
               class="text_input" :value="field.defaultValue"></Input>
        <InputNumber v-if="field.fieldType==='number'&&!field.fieldName.endsWith('_fee')" :name="field.fieldName"
                     class="text_input"
                     @input="valueChange($event,field)"
                     :value="field.defaultValue"></InputNumber>
        <InputNumber v-if="field.fieldType==='integer'&&!field.fieldName.endsWith('_time')" :name="field.fieldName"
                     class="text_input"
                     @input="valueChange($event,field)"
                     :value="field.defaultValue"></InputNumber>
        <div v-if="field.fieldType==='number'&&field.fieldName.endsWith('_fee')">
          <InputNumber :name="field.fieldName"
                       class="text_input"
                       @input="valueChange($event,field)"
                       :value="field.defaultValue">
            <span slot="prepend">￥</span>
          </InputNumber>
          <span>First Fee:</span>
        </div>
        <i-switch v-if="field.fieldType==='boolean'" :name="field.fieldName" size="large"
                  @input="valueChange($event,field)"
                  :value="field.defaultValue">
          <span slot="open">true</span>
          <span slot="close">false</span>
        </i-switch>
        <div
            v-if="field.fieldType==='map'"
        >
          <Row :key="index" v-for="(item, index) in mapList[field.fieldName]">
            <Col span="10">
              <FormItem
                  style="width: 100%"
                  label="key: "
                  key="mapKey"
              >
                <Input
                    style="width: 100%"
                    name="key"
                    class="text_input"
                    v-if="field.fieldName!=='config.extra_unit'"
                    :value="field.defaultValue?(Object.entries(field.defaultValue).length?Object.keys(field.defaultValue)[0]:null):null"
                    @input="valueChange($event,field)"
                >
                </Input>
                <Select
                    style="width: 260px"
                    filterable
                    clearable
                    v-model="item.key"
                    v-if="field.fieldName==='config.extra_unit'"
                >
                  <Option v-for="item in routes" :value="item.id" :key="item.id">
                    {{ item.name + '(' + item.paths[0] + ')' }}
                  </Option>
                </Select>
              </FormItem>

            </Col>
            <Col span="8" offset="1">
              <FormItem
                  :label-width="300"
                  :label="mapFiled.fieldName+': ' "
                  v-for="mapFiled of field.mapValueFields.fields"
                  :key="mapFiled.fieldName"
                  v-if="field.mapValueFields.type==='record'"
              >
                <!--          <div v-for="mapFiled of field.mapValueFields.fields">-->
                <Input v-if="mapFiled.fieldType==='set'&&mapFiled.elementType==='string'" :name="mapFiled.fieldName"
                       class="text_input" :value="mapFiled.defaultValue">

                </Input>
                <InputNumber v-if="mapFiled.fieldType==='number'" :name="mapFiled.fieldName" class="text_input"
                             @input="valueChange($event,field,mapFiled)"
                             :value="Object.entries(field.defaultValue).length?Object.entries(field.defaultValue)[0][1][mapFiled.fieldName]||null:null"></InputNumber>
                <!--          </div>-->
              </FormItem>
              <FormItem
                  label="value: "
                  key="value"
                  v-if="field.mapValueFields.type==='integer'"
              >
                <InputNumber
                    name="value"
                    style="width: 200px"
                    class="text_input"
                    v-model="item.value"
                >
                >
                </InputNumber>
                <!--          </div>-->
              </FormItem>
            </Col>
            <Col span="4" offset="1">
              <Button @click="handleRemove(field.fieldName,index)">Delete</Button>
            </Col>
          </Row>
          <FormItem>
            <Row>
              <Col span="12">
                <Button type="dashed" long @click="handleAdd(field.fieldName)" icon="md-add">Add item</Button>
              </Col>
            </Row>
          </FormItem>
        </div>
      </FormItem>


      <FormItem>
        <Button type="primary" @click="savePlugin">Save</Button>
      </FormItem>
    </Form>
  </div>
</template>

<script>

import {deepClone} from "../../utils";

export default {
  name: "AddPlugin",
  data() {
    return {
      pluginId: '',
      formItem: {
        name: '',
        consumer: {},
        service: {},
        route: {},
        config: {},
        enabled: true,
      },
      enabledPlugins: [],
      schemaFields: [],
      flatFields: [],
      consumers: [],
      services: [],
      routes: [],
      runOns: ['first', 'second', 'all'],
      mapList: {
        'config.extra_unit': []
      },
    }
  },
  watch: {
    name: function (newVal, oldVal) {
      if (oldVal) {
        this.formItem.config = {};
      }

      this.loadPluginSchema();
    }
  },
  computed: {
    name() {
      return this.formItem.name;
    },
    serviceId: {
      get() {
        return this.formItem.service.id;
      },
      set(newValue) {
        if (newValue) {
          this.formItem.service.id = newValue;
        } else {
          this.formItem.service.id = null;
        }
      }

    }
  },
  mounted() {
    this.serviceId = this.$route.params.serviceId;
    this.formItem.consumer.id = this.$route.params.consumerId;
    this.pluginId = this.$route.params.pluginId;
    if (this.pluginId) {
      this.loadPlugin();
    } else {
      this.loadPlugins();
      this.loadConsumers();
      this.loadServices();
    }
    setTimeout(()=>{
      this.loadRoutes();
    },1000)


  },
  methods: {
    loadPlugin() {
      this._get('/plugins/' + this.pluginId, response => {
        let formItem = response.data;
        this.serviceId = this.formItem.service.id;
        if (!formItem.consumer) {
          formItem.consumer = {};
        }
        if (!formItem.route) {
          formItem.route = {};
        }
        if (!formItem.service) {
          formItem.service = {};
        }
        if (formItem.name === 'my-rate-limit') {
          if (!formItem.config.start_time) {
            formItem.config.start_time = new Date().getTime()
          }

        }
        this.formItem = formItem;
        if (formItem.config.extra_unit){
          for (const [k,v] of Object.entries(formItem.config.extra_unit)){
            this.mapList["config.extra_unit"].push({
              key:k,
              value:v
            })
          }
          // Object.entries(formItem.config.extra_unit).map((v)=>)
          formItem.config.extra_unit={}
        }
        // console.log(JSON.stringify(this.formItem));
        this.loadPlugins();
        this.loadConsumers();
        this.loadServices();
      });
    },
    loadPlugins() {
      this._get('/plugins/enabled', response => {
        this.enabledPlugins = response.data.enabled_plugins;
      });
    },
    loadPluginSchema() {
      if (this.name) {
        this._get('/schemas/plugins/' + this.name, response => {
          // console.log('this.schemaFields>', response.data.fields.splice(-1));
          this.schemaFields = response.data.fields.splice(-1)[0].config.fields;

          this.flatFields = [];
          this.unpackFields(this.schemaFields, 'config');
        });
      }

    },
    unpackFields(fields, parent) {
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        let entries = Object.entries(field);
        let fieldName = entries[0][0];
        let fieldValue = entries[0][1];
        let type = fieldValue.type;
        if (type === 'record') {
          let fieldObj = fieldValue.fields
          this.unpackRecord(fieldObj, parent + '.' + fieldName);
        } else {
          if (type === 'map') {
            if (fieldValue.values.fields){
              let mapFieldValues = fieldValue.values.fields
              fieldValue.values.fields = mapFieldValues && mapFieldValues.map((mapField) => {
                let mapFieldObj = Object.entries(mapField)
                let mapFieldName = mapFieldObj[0][0];
                let mapFieldValue = mapFieldObj[0][1];
                let mapType = mapFieldValue.type;
                let mapDefaultValue = mapFieldValue.default || null;
                return this.formField(mapFieldName, mapType, mapType, mapDefaultValue);
              })
              fieldValue.values.key = fieldValue.keys
            }

          }

          let elementType;
          let defaultValue = fieldValue.default || null;
          if (fieldValue.elements) {
            elementType = fieldValue.one_of ? 'select' : fieldValue.elements.type;
            defaultValue = fieldValue.elements.default;
          } else if (fieldValue.one_of) {
            elementType = 'select'
            fieldValue.values = fieldValue.one_of
          }
          let finalFieldName = parent + '.' + fieldName;
          let formField = this.formField(finalFieldName, type, elementType, defaultValue, fieldValue.values);
          this.flatFields.push(formField);
          this.valueChange(formField.defaultValue, formField);
        }

      }

    },
    unpackRecord(fields, parent) {
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        if (!field) {
          continue
        }
        let fieldObj = Object.entries(field)[0];
        let fieldName = fieldObj[0];
        // console.log('fieldObj>>>', fieldObj, isNaN(fieldName))
        if (isNaN(fieldName)) {
          let elementType;
          let fieldObj1 = fieldObj[1];

          let defaultValue = fieldObj1.default || null;
          if (fieldObj1.elements) {
            elementType = fieldObj1.elements.type;
            defaultValue = fieldObj1.elements.default;
          } else if (fieldObj1.one_of) {
            elementType = 'select'
            fieldObj1.values = fieldObj1.one_of
          }
          let finalFieldName = parent + '.' + fieldName;
          if (fieldObj1.type === 'record') {
            this.unpackFields(fieldObj1.fields, finalFieldName);
            continue;
          }
          let formField = this.formField(finalFieldName, fieldObj1.type, elementType, defaultValue, fieldObj1.values);
          this.flatFields.push(formField);
          this.valueChange(formField.defaultValue, formField);

        }
      }
    },

    formField(fieldName, fieldType, elementType, defaultValue, mapValueFields) {
      let array = fieldName.split('.');
      let obj = this.formItem.config;
      for (let i = 1; i < array.length; i++) {

        let name = array[i];
        if (i < array.length - 1) {
          //not the last one
          if (!obj[name]) {
            break;
          }
          obj = obj[name];
        } else {
          let value = obj[name];
          if (value) {
            if (fieldType === 'array' || fieldType === 'set') {
              defaultValue = value.join(',');
            } else {
              defaultValue = value;
            }
          }
        }
      }
      let res = {
        fieldName: fieldName,
        fieldType: fieldType,
        defaultValue: defaultValue,
        elementType: elementType,
        mapValueFields: mapValueFields
      }
      if (elementType === 'select') {
        res['selectValues'] = mapValueFields
      }
      return res
    },
    loadConsumers() {
      let url = '/consumers?size=1000';
      this._get(url, response => {
        this.consumers = response.data.data;
      });

    },
    loadServices() {
      this._get('/services', response => {
        this.services = response.data.data;
      });
    },
    loadRoutes() {
      this.routes = [];
      let url = '/routes?size=1000';
      console.log('this.formItem.service>',this.formItem.service)
      if (this.formItem.service.id) {
        url = '/services/' + this.formItem.service.id + '/routes'
      }
      this._get(url, response => {
        this.routes = response.data.data;
      });

    },
    valueChange: function (val, formField, mapField) {
      console.log('val change:' + val, formField.fieldName, formField);
      if (formField.fieldName === 'config.start_time') {
        val = val == null ? Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) : new Date(val).getTime()
      } else if (formField.fieldName === 'config.end_time') {
        val = val && new Date(val).getTime()
      }
      if (val == null || typeof val === 'object') {
        return;
      }

      let fieldName = formField.fieldName;
      let fieldType = formField.fieldType;
      let elementType = formField.elementType;
      if ((fieldType === 'array' || fieldType === 'set') && elementType === 'string') {
        if (val === '') {
          val = [];
        } else {
          val = val.split(',');
        }

      }
      if ((fieldType === 'array' || fieldType === 'set') && elementType === 'number') {
        let tmpStrArray = val.split(',');
        val = [];
        tmpStrArray.forEach(str => {
          val.push(parseInt(str));
        });

      }
      if (formField.fieldName === 'config.start_time' || formField.fieldName === 'config.end_time') {

        console.log('val>>', val)
      }
      if (fieldType === 'string' && val === '') {
        val = null;
      }

      let nameArr = fieldName.split('.');
      let obj = this.formItem.config;
      for (let i = 1; i < nameArr.length; i++) {
        let name = nameArr[i];
        if (i < nameArr.length - 1) {
          //not the last one
          if (!obj[name]) {
            obj[name] = {};
          }
          obj = obj[name];
        } else {
          if (fieldType === 'map') {
            if (!obj[name]) {
              obj[name] = {};
            }
            let mapEntries = Object.entries(obj[name])
            // console.log('mapField',mapField)
            let mapValue = mapEntries.length ? mapEntries[0][1] : null,
                mapKey = mapEntries.length ? mapEntries[0][0] : null
            // mapEntries[0][0]
            if (mapField) {
              if (!mapKey) {
                this.$Message.error('请先输入Key')
                return;
              }
              if (!obj[name][mapKey]) {
                obj[name][mapKey] = {}
              }
              obj[name][mapKey][mapField.fieldName] = val
            } else {
              obj[name] = {[val]: mapValue}
            }
          } else {
            obj[name] = val;
          }
        }

      }
    },
    savePlugin() {
      let _this = this;
      // console.log(_this.formItem,_this.formItem.config.extra_unit)

      const formData = deepClone(this.formItem)

      const extra_config = this.mapList['config.extra_unit']
      if (extra_config.length) {
        let extra_data = {}
        for (let i in extra_config) {
          // console.log('i???',i)
          const key=extra_config[i].key,value = extra_config[i].value
          if(key&&value){

            extra_data[key] = value
          }

        }
        formData.config['extra_unit']=extra_data
      }

      if (!formData.service.id) {
        formData.service = null;
      }
      if (!formData.consumer.id) {
        formData.consumer = null;
      }
      if (!formData.route.id) {
        formData.route = null;
      }
      if (!this.pluginId) {
        this._post('/plugins', formData, () => {
          _this.$router.go(-1);
        });
      } else {
        //edit
        this._patch('/plugins/' + this.pluginId, formData, () => {
          _this.$router.go(-1);
        });
      }

    },
    clearService() {
      this.formItem.service.id = '';
      this.$refs.service.clearSingleSelect();
    },
    isKong2() {
      return localStorage.kongVersion.startsWith('2');
    },
    handleAdd(filedName) {
      if (!filedName) {
        return
      }
      if (!this.mapList[filedName]) {
        this.mapList[filedName] = []
      }

      this.mapList[filedName].push({
        key: null,
        value: null,
        index: this.mapList.length,
        status: 1
      });
      // console.log('mapList>', this.mapList)
    },
    handleRemove(filedName, index) {
      if (!filedName) {
        return
      }
        this.mapList[filedName].splice(index, 1)
      console.log('this.mapList[filedName]>',this.mapList[filedName])

    }

  }
}
</script>

<style scoped>
.field_desc {
  margin-left: 10px;
}

.text_input {
  max-width: 200px;
}

.text_input_multiple {
  max-width: 400px;
}

.clear_button {
  margin-left: 10px;
}
</style>

