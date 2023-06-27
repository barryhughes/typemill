const raweditor = Vue.createApp({
	template: `
				<fieldset v-if="showraw" class="px-12 py-8 bg-stone-50 shadow-md mb-16">
					<div class="w-full px-6 py-3" :class="{'error' : errors.title}">
						<label class="block mb-1 font-medium" for="title">{{ $filters.translate('Title') }}*</label>
						<input 
							name="title" 
							type="text" 
							class="w-full p-4 text-white bg-stone-700 text-3xl" 
							v-model="title" 
							@input="updateTitle" 
							required 
						/>
						<span class="error" v-if="errors.title">{{ errors.title }}</span>
					</div>
					<div class="w-full plain mt-5 mb-5 px-6 py-3">
						<label for="raweditor" class="block mb-1 font-medium">{{ $filters.translate('Markdown') }}</label>
						<div class="codearea">
							<textarea 
								name="raweditor" 
								data-el="editor" 
								class="editor" 
								ref="raweditor" 
								v-model="content"
								@input="updateBody"
							>
							</textarea>
							<pre aria-hidden="true" class="highlight hljs"><code data-el="highlight" v-html="highlighted"></code></pre>
						</div>
					</div>
				</fieldset>
				`,
	data() {
		return {
			title: 'loading',
			content: 'loading',
			item: data.item,
			highlighted: '',
			errors: false,
			freeze: false,
			showraw: true,		
		}
	},
	mounted() {
		this.initializeContent(data.content)

		eventBus.$on('savedraft', this.saveDraft);
		eventBus.$on('publishdraft', this.publishDraft);
		eventBus.$on('showEditor', this.showEditor );
		eventBus.$on('hideEditor', this.hideEditor );
		eventBus.$on('content', content => {
			this.initializeContent(content);
		});
	},
	methods: {
		showEditor()
		{
			this.showraw = true;
			this.$nextTick(() => {
				this.resizeCodearea();
			})			
		},
		hideEditor()
		{
			this.showraw =false;
		},		
		initializeContent(contentArray)
		{
			let markdown = '';
			let title = contentArray.shift();

			for(item in contentArray)
			{
				markdown += contentArray[item].markdown + '\n\n';
			}
			this.title = title.markdown;
			this.content = markdown;

			this.highlight(this.content);
			this.resizeCodearea();
		},
		updateTitle()
		{
			eventBus.$emit('editdraft');
		},
		updateBody()
		{
			this.highlight(this.content);
			this.resizeCodearea();
			eventBus.$emit('editdraft');
		},
		resizeCodearea()
		{
			let codeeditor = this.$refs["raweditor"];

			window.requestAnimationFrame(() => {
				codeeditor.style.height = '200px';
				if (codeeditor.scrollHeight > 200)
				{
					codeeditor.style.height = `${codeeditor.scrollHeight + 2}px`;
				}
			});
		},
		highlight(code)
		{
			if(code === undefined)
			{
				return;
			}

			window.requestAnimationFrame(() => {
				highlighted = hljs.highlightAuto(code, ['markdown']).value;
				this.highlighted = highlighted;
			});
		},
		saveDraft()
		{
			var self = this;
			tmaxios.put('/api/v1/draft',{
				'url':	data.urlinfo.route,
				'item_id': this.item.keyPath,
				'title': this.title,
				'body': this.content
			})
			.then(function (response) {
				self.item = response.data.item;
				eventBus.$emit('cleardraft');
				eventBus.$emit('item', response.data.item);
				eventBus.$emit('navigation', response.data.navigation);			
			})
			.catch(function (error)
			{

			});
		},
		publishDraft()
		{
			var self = this;
			tmaxios.post('/api/v1/draft/publish',{
				'url':	data.urlinfo.route,
				'item_id': this.item.keyPath,
				'title': this.title,
				'body': this.content
			})
			.then(function (response) {
				self.item = response.data.item;
				eventBus.$emit('cleardraft');
				eventBus.$emit('item', response.data.item);
				eventBus.$emit('navigation', response.data.navigation);			
			})
			.catch(function (error)
			{

			});
		},
	},
})