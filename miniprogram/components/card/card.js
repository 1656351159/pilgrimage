Component({
  options: {
    multipleSlots: true
  },
  properties: {
    title: {
      type: String,
      value: ''
    },
    extra: {
      type: String,
      value: ''
    },
    showTitleBar: {
      type: Boolean,
      value: true
    },
    showArrow: {
      type: Boolean,
      value: false
    },
    footer: {
      type: Boolean,
      value: false
    },
    customClass: {
      type: String,
      value: ''
    },
    customStyle: {
      type: String,
      value: ''
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap');
    }
  }
})
