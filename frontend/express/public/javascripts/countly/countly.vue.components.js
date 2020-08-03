/* global countlyCommon, moment, jQuery, Vue, Vuex, T, countlyView, CountlyHelpers */
(function(CountlyVueComponents, $) {

    /**
     * CLY Select list VueJS component. It supports big lists and search.
     */
    CountlyVueComponents.selectList = {
        template: '<div ref="selectList" class="cly-select text-align-left" v-bind:class="{\'big-list\' : isBigList, \'disabled\' : isDisabled}" > <div class="select-inner"> <div class="text-container"> <div v-if="selectedItem" class="text" style="width:80%" v-bind:data-value="selectedItem.value"><span v-text="selectedItem.text"></span></div><div v-if="!selectedItem" class="text" style="width:80%"><span class="text-light-gray" v-text="placeholder"></span></div></div><div class="right combo"></div></div><div class="select-items square" style="width:100%;" v-bind:style="customStyle"> <div class="warning" v-if="isBigList">' + jQuery.i18n.map['drill.big-list-warning'] + '</div><div v-for="item in items" v-on:click="itemOnSelect(item)" v-bind:class="{item: item.value, group : !item.value}"> <div v-if="!item.value"><span v-text="item.name"></span></div><div v-if="item.value" v-bind:data-value="item.value" ><span v-text="item.name"></span></div></div></div></div>',
        props: {
            placeholder: { type: String, default: '' },
            selectedItem: Object,
            items: { type: Array, default: [] },
            onSelectionChange: { type: Function, required: true },
            verticleAligned: { type: Boolean, default: false },
            isBigList: { type: Boolean, default: false },
            onSearch: { type: Function },
            isDisabled: { type: Boolean, default: false}
        },
        data: function() {
            return { searchKey: "" };
        },
        methods: {
            itemOnSelect: function(item) {
                if (item.value) {
                    this.onSelectionChange(item);
                }
            },
            selectOnClick: function(element) {
                if (this.isBigList && this.onSearch) {
                    var self = this;
                    setTimeout(function() {
                        var timeout = null;

                        $(element).find('input').val(self.searchKey);
                        $(element).find('input').unbind('keyup').bind('keyup', function() {
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = null;
                            }
                            var key = $(this).val();
                            timeout = setTimeout(function() {
                                $(element).find('.select-items').prepend("<div class='table-loader' style='top:-1px'></div>");
                                self.searchKey = key;
                                self.onSearch(key);
                            }, 1000);
                        });
                    });
                }
            }
        },
        updated: function() {
            var selectListDOM = $(this.$refs.selectList);
            selectListDOM.find('.table-loader').detach();
            if (this.selectedItem) {
                selectListDOM.clySelectSetSelection(this.selectedItem.value, this.selectedItem.name);
            }

            selectListDOM.unbind('click').bind("click", this.selectOnClick.bind(this, selectListDOM));

            //For move items to slimscroll area after search event;
            if (selectListDOM.find('.select-items').is(':visible') && selectListDOM.find('.warning').is(':visible')) {
                selectListDOM.find('.item').each(function() {
                    var item = $(this);
                    item.removeClass('hidden');
                    item.detach();
                    item.insertAfter(selectListDOM.find('.warning'));
                });
            }
        },
        mounted: function() {
            if (this.selectedItem) {
                $(this.$refs.selectList).clySelectSetSelection(this.selectedItem.value, this.selectedItem.name);
            }

            $(this.$refs.selectList).unbind('click').bind("click", this.selectOnClick.bind(this, $(this.$refs.selectList)));
        },
        computed: {
            customStyle: function() {
                if (this.verticleAligned) {
                    switch (this.items.length) {
                    case 0:
                    case 1:
                    case 2:
                        return { top: "-15px", minHeight: 'auto', position: "absolute" };
                    case 3:
                    case 4:
                        return { top: "-40px", minHeight: 'auto', position: "absolute" };
                    case 5:
                    case 6:
                        return { top: "-70px", minHeight: 'auto', position: "absolute" };
                    default:
                        return { top: "27px", minHeight: 'auto', position: "absolute" };
                    }
                }
                else {
                    return {};
                }
            }
        }
    };

    /**
     * CLY Input. (Text and number html input)
     */
    CountlyVueComponents.input = {
        template: '<input v-bind:type="inputType" v-bind:placeholder="placeholder" class="string-input disabled" v-bind:value="value" v-on:keyup="onChange">',
        props: { placeholder: { type: String, default: 'String' }, inputType: { type: String, default: 'text' }, value: { default: null }, onValueChanged: { type: Function } },
        methods: {
            onChange: function(e) {
                if (this.onValueChanged) {
                    this.onValueChanged({
                        value: this.inputType.toLowerCase() === "number" ? parseInt(e.target.value) : e.target.value,
                        type: this.inputType.toLowerCase() === "number" ? "inputnumber" : "inputtext"
                    });
                }
            }
        }
    };


    /**
     * CLY Date Picker
     */
    CountlyVueComponents.datePicker = {
        template: '<div ref="datePicker" class="date-picker-component"><input type="text" placeholder="Date" class="string-input date-value" readonly v-on:click="onClick" v-bind:value="formatDate"><div class="date-picker" style="display:none"><div class="calendar-container calendar-light"><div class="calendar"></div></div></div></div>',
        props: { placeholder: { type: String, default: 'Date' }, value: { default: null }, onValueChanged: { type: Function, required: true }, maxDate: Date },
        computed: {
            formatDate: function() {
                if (this.value) {
                    return countlyCommon.formatDate(moment(this.value * 1000), "DD MMMM, YYYY");
                }
                else {
                    return null;
                }
            }
        },
        mounted: function() {

            var datePickerDOM = $(this.$refs.datePicker).find('.date-picker');

            var self = this;
            datePickerDOM.find(".calendar").datepicker({
                numberOfMonths: 1,
                showOtherMonths: true,
                onSelect: function(selectedDate) {
                    var instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings),
                        currMoment = moment(date);

                    var selectedTimestamp = moment(currMoment.format("DD MMMM, YYYY"), "DD MMMM, YYYY").unix();
                    var tzCorr = countlyCommon.getOffsetCorrectionForTimestamp(selectedTimestamp);
                    var selectedValue = selectedTimestamp - tzCorr;

                    self.onValueChanged({
                        value: selectedValue,
                        type: 'datepicker'
                    });
                    $(".date-picker").hide();
                }
            });

            if (this.maxDate) {
                datePickerDOM.find(".calendar").datepicker('option', 'maxDate', this.maxDate);
            }

            $.datepicker.setDefaults($.datepicker.regional[""]);
            datePickerDOM.find(".calendar").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);

            if (this.value) {
                datePickerDOM.find(".calendar").datepicker("setDate", moment(this.value * 1000).toDate());
            }

            datePickerDOM.click(function(e) {
                e.stopPropagation();
            });
        },
        updated: function() {
            var datePickerDOM = $(this.$refs.datePicker).find('.date-picker');
            if (this.value) {
                datePickerDOM.find(".calendar").datepicker("setDate", moment(this.value * 1000).toDate());
            }
            if (this.maxDate) {
                datePickerDOM.find(".calendar").datepicker('option', 'maxDate', this.maxDate);
            }
        },
        methods: {
            onClick: function(e) {
                $(".date-picker").hide();

                $(this.$refs.datePicker).find(".date-picker").show();

                e.stopPropagation();
            }
        }
    };

    /*
        Countly + Vue.js
    */

    var autoRefreshMixin = {
        mounted: function() {
            var self = this;
            this.$root.$on("cly-refresh", function() {
                self.refresh();
            });
        },
        methods: {
            refresh: function() {}
        }
    };

    var i18nMixin = {
        methods: {
            i18n: function() {
                return jQuery.i18n.prop.apply(null, arguments);
            }
        }
    };

    var refreshOnParentActiveMixin = {
        watch: {
            isParentActive: function(newState) {
                if (newState) {
                    this.refresh();
                }
            }
        },
        methods: {
            refresh: function() {}
        }
    };

    var _mixins = {
        'autoRefresh': autoRefreshMixin,
        'refreshOnParentActive': refreshOnParentActiveMixin,
        'i18n': i18nMixin,
    };

    var _globalVuexStore = new Vuex.Store();

    var _vuex = {
        getGlobalStore: function() {
            return _globalVuexStore;
        },
        registerGlobally: function(wrapper, force) {
            var store = _globalVuexStore;
            if (!store.hasModule(wrapper.name) || force) {
                store.registerModule(wrapper.name, wrapper.module);
            }
        }
    };

    var countlyVueWrapperView = countlyView.extend({
        constructor: function(opts) {
            this.component = opts.component;
            this.defaultArgs = opts.defaultArgs;
            this.vuex = opts.vuex;
            this.templates = opts.templates;
            this.elementsToBeRendered = [];
        },
        beforeRender: function() {
            var self = this;
            if (this.templates) {
                var templatesDeferred = [];
                for (var name in this.templates.mapping) {
                    var fileName = this.templates.mapping[name];
                    var elementId = self.templates.namespace + "-" + name;
                    templatesDeferred.push(function(fName, elId) {
                        return T.get(fName, function(src) {
                            self.elementsToBeRendered.push("<script type='text/x-template' id='" + elId + "'>" + src + "</script>");
                        });
                    }(fileName, elementId));
                }
                return $.when.apply(null, templatesDeferred);
            }
            return true;
        },
        renderCommon: function(isRefresh) {
            if (!isRefresh) {
                $(this.el).html("<div class='vue-wrapper'></div><div id='vue-templates'></div>");
                this.elementsToBeRendered.forEach(function(el) {
                    $("#vue-templates").append(el);
                });
            }
        },
        refresh: function() {
            var self = this;
            if (self.vueInstance) {
                self.vueInstance.$emit("cly-refresh");
            }
        },
        afterRender: function() {
            var el = $(this.el).find('.vue-wrapper').get(0),
                self = this;

            if (self.vuex) {
                self.vuex.forEach(function(item) {
                    _vuex.registerGlobally(item.clyModel.getVuexModule());
                });
            }

            self.vueInstance = new Vue({
                el: el,
                store: _vuex.getGlobalStore(),
                render: function(h) {
                    if (self.defaultArgs) {
                        return h(self.component, { attrs: self.defaultArgs });
                    }
                    else {
                        return h(self.component);
                    }
                }
            });
        },
        destroy: function() {
            this.elementsToBeRendered = [];
        }
    });

    var countlyBaseView = Vue.extend({
        mixins: [
            _mixins.autoRefresh,
            _mixins.i18n
        ],
        props: {
            name: { type: String, default: null},
            id: { type: String, default: null }
        },
        computed: {
            isParentActive: function() {
                return this.$parent.isActive !== false;
            },
            vName: function() {
                return this.name;
            },
            vId: function() {
                return this.id;
            }
        }
    });

    var _views = {
        BackboneWrapper: countlyVueWrapperView,
        BaseView: countlyBaseView
    };

    window.countlyVue = {
        mixins: _mixins,
        vuex: _vuex,
        views: _views
    };

    // New components

    Vue.component("cly-datatable", {
        template: '<table ref="dtable" cellpadding="0" cellspacing="0" class="cly-vue-datatable-wrapper d-table"></table>',
        data: function() {
            return {
                isInitialized: false,
                tableInstance: null
            };
        },
        props: {
            rows: { type: Array, default: [] },
            columns: { type: Array }
        },
        methods: {
            initialize: function() {
                this.isInitialized = false;
                this.tableInstance = $(this.$refs.dtable).dataTable($.extend({}, $.fn.dataTable.defaults, {
                    "aaData": this.rows,
                    "aoColumns": this.columns
                }));
                this.tableInstance.stickyTableHeaders();
                this.isInitialized = true;
            },
            refresh: function() {
                if (this.isInitialized) {
                    CountlyHelpers.refreshTable(this.tableInstance, this.rows);
                }
                else {
                    this.initialize();
                }
            }
        },
        watch: {
            rows: function() {
                this.refresh();
            }
        },
        mounted: function() {
            this.initialize();
        }
    });

    Vue.component("cly-tabs", {
        template: '<div class="cly-vue-tabs"><ul class="cly-vue-tabs-list"><li v-for="(tab, i) in tabs" :key="i" :class="{\'is-active\': tab.isActive}"><a @click="setTab(tab.tId)" v-html="tab.tName"></a></li></ul><div class="cly-vue-tabs-container"><slot/></div></div>',
        mixins: [
            _mixins.i18n
        ],
        data: function() {
            return {
                tabs: [],
                currentTabId: '',
            };
        },
        props: {
            initialTab: { default: null },
        },
        methods: {
            setTab: function(tId) {
                this.currentTabId = tId;
            }
        },
        created: function() {
            if (this.initialTab) {
                this.currentTabId = this.initialTab;
            }
        },
        mounted: function() {
            this.tabs = this.$children;
            if (this.currentTabId === '' && this.tabs.length > 0) {
                this.currentTabId = this.tabs[0].tId;
            }
        },
        watch: {
            currentTabId: function(newId) {
                this.$emit("tab-changed", newId);
            }
        }
    });

    Vue.component("cly-tab", {
        template: '<div v-show="isActive"><slot/></div>',
        mixins: [
            _mixins.i18n
        ],
        props: {
            name: { type: String, default: null},
            id: { type: String, default: null },

        },
        computed: {
            isActive: function() {
                return this.$parent.currentTabId === this.id;
            },
            tName: function() {
                return this.name;
            },
            tId: function() {
                return this.id;
            }
        }
    });

    Vue.component("cly-panel", {
        template: '<div class="cly-vue-panel widget">\
                        <div class="widget-header">\
                            <div class="left">\
                                <div class="title">{{title}}</div>\
                            </div>\
                            <div class="right">\
                                <cly-global-date-selector></cly-global-date-selector>\
                            </div>\
                        </div>\
                        <div class="widget-content help-zone-vb">\
                            <slot/>\
                        </div>\
                    </div>',
        props: {
            title: { type: String, required: true }
        },
    });

    Vue.component("cly-global-date-selector", {
        template: "#template-cly-vue-global-date-selector",
        mixins: [
            _mixins.i18n
        ],
        data: function(){
            return {
                currentRange: "",
                isOpened: false
            }
        },
        methods: {
            toggle: function() {
                this.isOpened = !this.isOpened;
            }
        }
    })

    Vue.component("cly-time-graph", {
        template: '<div ref="container" class="cly-vue-time-graph graph-component no-data"></div>',
        props: {
            data: function(){ 
                return { required: true }
            }
        },
        mounted: function() {
            this.render();
        },
        methods: {
            render: function() {

                if ($(this.$refs.container).is(":hidden")) {
                    // no need to render if hidden
                    return;
                }

                var mapped = this.data.map(function(val, idx) {
                    return [idx + 1, val];
                });

                var prev = this.data.map(function(val, idx) {
                    return [idx + 1, val / 2];
                });

                var points = [{
                    "data": prev,
                    "label": "Total Sessions",
                    "color": "#DDDDDD",
                    "mode": "ghost"
                }, {
                    "data": mapped,
                    "label": "Total Sessions",
                    "color": "#52A3EF"
                }];

                countlyCommon.drawTimeGraph(points, $(this.$refs.container));
            }
        },
        watch: {
            data: function() {
                this.render();
            }
        },
    });

}(window.CountlyVueComponents = window.CountlyVueComponents || {}, jQuery));

