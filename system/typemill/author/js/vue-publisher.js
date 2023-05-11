const publisher = Vue.createApp({
	template: `
			<div id="publishController" class="text-sm" v-cloak>
				<div v-if="message" :class="messageClass" class="block w-full px-3 py-1 text-white transition duration-100">{{ message }}</div>
				<div class="flex justify-between px-6 py-3">
					<div class="flex">
						<div class="border-l-4 w-32 px-2 py-2" :class="getStatusClass(item.status)">
							{{ item.status }}
						</div>
						<button 
							v-if="raw" 
							@click.prevent="saveDraft" 
							:disabled="isPublished"
							class="cursor-pointer ml-1 w-24 px-4 py-2 border border-stone-200 text-white bg-teal-500 hover:bg-teal-600 disabled:bg-stone-50 disabled:text-stone-900 disabled:cursor-not-allowed transition" 
							>
							save draft
						</button>
						<button 
							@click.prevent="publishArticle"
							:disabled="isPublished"
							class="cursor-pointer ml-1 w-24 px-4 py-2 border border-stone-200 text-white disabled:bg-stone-50 disabled:text-stone-900 disabled:cursor-not-allowed transition" 
							:class="publishClass"
							>
							publish
						</button>
						<button 
							@click.prevent="showModal = 'discard'" 
							:disabled="!isModified"
							class="cursor-pointer ml-1 w-24 px-4 py-2 border border-stone-200 text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-stone-50 disabled:text-stone-900 disabled:cursor-not-allowed transition" 
							>
							discard
						</button>
						<button 
							v-if="item.originalName != 'home'"
							@click.prevent="checkUnpublish" 
							:disabled="isUnpublished"
							class="cursor-pointer ml-1 w-24 px-4 py-2 border border-stone-200 text-white bg-teal-500 hover:bg-teal-600 disabled:bg-stone-50 disabled:text-stone-900 disabled:cursor-not-allowed transition" 
							>
							unpublish
						</button>
						<button 
							v-if="item.originalName != 'home'"
							@click.prevent="showModal = 'delete'"
							class="cursor-pointer ml-1 w-24 px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-rose-500 hover:text-white transition" 
							>
							delete
						</button>
					</div>
					<div class="flex">
						<a 
							v-if="visual" 
							href="{{ base_url }}/tm/content/raw{{ itemurl }}" 
							class="px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-stone-700 hover:text-white transition ml-1" 
							>
							raw editor
						</a>
						<a 
							v-if="raw" 
							href="{{ base_url }}/tm/content/visual{{ itemurl }}"
							class="px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-stone-700 hover:text-white transition ml-1" 
							@click="checkUnsafedContent(event)" 
							>
							visual editor
						</a>
						<a 
							href="{{ item.urlAbs }}"
							target="_blank" 
							class="px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-stone-700 hover:text-white transition ml-1" 
							>
							<svg class="icon baseline icon-external-link">
								<use xlink:href="#icon-external-link"></use>
							</svg>
						</a>
					</div>
				</div>
				<transition name="fade">
					<modal v-if="showModal == 'discard'" @close="showModal = false">
				    	<template #header>
				    		<h3>Discard changes</h3>
				    	</template>
				    	<template #body>
				    		<p>Do you want to discard your changes and set the content back to the live version?</p>
				    	</template>
				    	<template #button>
				    		<button @click="discardChanges" class="focus:outline-none px-4 p-3 mr-3 text-white bg-rose-500 hover:bg-rose-700 transition duration-100">Discard changes</button>
				    	</template>
					</modal>
				</transition>
				<transition name="fade">
					<modal v-if="showModal == 'delete'" @close="showModal = false">
				    	<template #header>
				    		<h3>Delete page</h3>
				    	</template>
				    	<template #body>
				    		<p>Do you really want to delete this page? Please confirm.</p>
				    	</template>
				    	<template #button>
				    		<button @click="deleteArticle" class="focus:outline-none px-4 p-3 mr-3 text-white bg-rose-500 hover:bg-rose-700 transition duration-100">Delete page</button>
				    	</template>
					</modal>
				</transition>
				<transition name="fade">
					<modal v-if="showModal == 'unpublish'" @close="showModal = false">
				    	<template #header>
				    		<h3>Unpublish page</h3>
				    	</template>
				    	<template #body>
				    		<p>This page has been modified. If you unpublish the page, then we will delete the published version and keep the modified version. Please confirm.</p>
				    	</template>
				    	<template #button>
				    		<button @click="unpublishArticle" class="focus:outline-none px-4 p-3 mr-3 text-white bg-rose-500 hover:bg-rose-700 transition duration-100">Unpublish page</button>
				    	</template>
					</modal>
				</transition>
			</div>`,
	data() {
		return {
			item: data.item,
			visual: false,
			raw: false,
			showModal: false,
			message: false,
			messageClass: '',
		}
	},
	components: {
		'modal': modal
	},
	mounted() {
		if(window.location.href.indexOf('/content/raw') > -1)
		{
			this.raw = true;
		}
		if(window.location.href.indexOf('/content/visual') > -1)
		{
			this.visual = true;
		}

		eventBus.$on('item', item => {
			this.item = item;
		});

		eventBus.$on('publishermessage', message => {
			this.message = message;
			this.messageClass = 'bg-rose-500';
		});

		eventBus.$on('publisherclear', this.clearPublisher);

	},
	computed: {
		isPublished()
		{
			return this.item.status == 'published' ? true : false;
	    },
		isModified()
		{
			return this.item.status == 'modified' ? true : false;
	    },
		isUnpublished()
		{
			return this.item.status == 'unpublished' ? true : false;
	    },
	    publishClass()
	    {
	    	if(this.item.status == 'unpublished')
	    	{
	    		return 'bg-teal-500 hover:bg-teal-600';
	    	}
	    	if(this.item.status == 'modified')
	    	{
	    		return 'bg-yellow-500 hover:bg-yellow-600';
	    	}
	    },
	},
	methods: {
		clearPublisher()
		{
			this.message 		= false;
			this.messageClass 	= false;
			this.showModal 		= false;
		},
		getStatusClass(status)
		{
			if(status == 'published')
			{
				return "border-teal-500";
			}
			else if(status == 'unpublished')
			{
				return "border-rose-500";
			}
			else if(status == 'modified')
			{
				return "border-yellow-500";
			}
		},
		publishArticle()
		{
			var self = this;

			tmaxios.post('/api/v1/article/publish',{
				'url':	data.urlinfo.route,
				'item_id': this.item.keyPath,
			})
			.then(function (response)
			{
				self.clearPublisher();
				eventBus.$emit('item', response.data.item);
				eventBus.$emit('navigation', response.data.navigation);
			})
			.catch(function (error)
			{
				if(error.response)
				{
					alert(error.response);
				}
			});
		},
		checkUnpublish()
		{
			if(this.item.status == 'modified')
			{
				this.showModal = 'unpublish';
			}
			else
			{
				this.clearPublisher();
				this.unpublishArticle();
			}
		},
		unpublishArticle()
		{
			self = this;

	        tmaxios.delete('/api/v1/article/unpublish',{
				data: {
					'url':	data.urlinfo.route,
					'item_id': this.item.keyPath,
				}
			})
			.then(function (response)
			{
				self.clearPublisher();
				eventBus.$emit('item', response.data.item);
				eventBus.$emit('navigation', response.data.navigation);
			})
			.catch(function (error)
			{
				if(error.response)
				{
					alert(error.response);
				}
			});
		},
		discardChanges()
		{
			self = this; 

			tmaxios.delete('/api/v1/article/discard',{
				data: {
					'url':	data.urlinfo.route,
					'item_id': this.item.keyPath,
				}
			})
	        .then(function (response)
			{
				self.clearPublisher();
				eventBus.$emit('item', response.data.item);
				eventBus.$emit('navigation', response.data.navigation);
				eventBus.$emit('content', response.data.content);
			})
			.catch(function (error)
			{
				if(error.response)
				{
					alert(error.response);
				}
			});
		},
		saveDraft()
		{
			var self = this;
			tmaxios.put('/api/v1/article',{

			})
			.then(function (response) {
				self.draftResult 	= 'success';
				navi.getNavi();
			})
			.catch(function (error)
			{
				self.draftDisabled 	= false;
				self.draftResult 	= 'fail';
				self.handleErrors(error);
			});
		},
		deleteArticle()
		{
			var self = this;

	        tmaxios.delete('/api/v1/article',{
				data: {
					'url':	data.urlinfo.route,
					'item_id': this.item.keyPath,
				}
			})
	        .then(function (response)
	        {
				window.location.replace(response.data.url);
	        })
			.catch(function (error)
			{
				if(error.response)
				{
					alert(error.response);
				}				
			});
		},
	},
})