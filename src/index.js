import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {render} from 'react-dom';
import { init } from 'contentful-ui-extensions-sdk';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import update from 'immutability-helper';
import arrayMove from 'array-move';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
	CardDragHandle,
	EntryCard, 
	ModalConfirm,
	Button,
	Form,
	TextInput,
	Textarea,
	TextField,
	Icon } from '@contentful/forma-36-react-components';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css'; 

const initFormat = {
    items: [{
            id: "item1",
            body: {
                content: "<p></p>",
                headline: "Default Item"
            },
            index: 0
        }],
    modal: {
        shown: false
    },
    target: {
        id: "",
        body: {
            content: "",
            headline: ""
        },
        index: null
    },
    overview: {
        content: "",
        headline: ""
    }
}
//TODO: remove modal for edit due to sizing issues. replace card with fields on edit
const DragHandle = SortableHandle(() => {
	return(
		<div className="CardDragHandle__CardDragHandle___2rqnO">
			<svg data-test-id="cf-ui-icon" 
				className="Icon__Icon___38Epv Icon__Icon--small___1yGZK Icon__Icon--muted___3egnD" 
				xmlns="http://www.w3.org/2000/svg" 
				width="24" 
				height="24" 
				viewBox="0 0 24 24"
			>
				<path 
					fill="none" 
					d="M0 0h24v24H0V0z">
				</path>
				<path 
					d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z">
				</path>
			</svg>
		</div>
	)
});

const SortableItem = SortableElement((props) => {
	return (

		<div className="Item" >
			<DragHandle/>
			<div>
				<h3>{props.child.body.headline}</h3>
				<div dangerouslySetInnerHTML={{ __html:props.child.body.content}}/>
			</div>

			<div className="buttonArea">
				<button onClick={()=>props.onChildEdit(props)}
				type="button"
					className="editButton">
					<Icon icon="Edit"/>

				</button>
					
			    <button onClick={()=>props.onChildRemove(props)}
			    	className="removeButton">
			    	<Icon icon="Close"/>
				</button>
			</div>				
		</div>

	)
});

const SortableList = SortableContainer((props) => {

	return (
		<div className="sortableList">
		<h3>Section Items</h3>
		  {props.items.map((item, index) => (
			    <SortableItem
			    	key={item.id} 	 
			    	index={index} 
			    	value={item} 
			    	onChildEdit={props.onEdit}
			    	onChildRemove={props.onRemove}
			    	id={item.id}
			    	childIndex={index}
			    	child={item}
			    	/>
			    )   	
		  )}
		 
	</div>
	);
});



export default class MainContent extends React.Component {
	static propTypes = {
		sdk: PropTypes.object.isRequired
	};
	constructor(props) {
		super(props);
		this.handleRTEchange = this.handleRTEchange.bind(this)
		this.clearAndSave = this.clearAndSave.bind(this)
			
	}
	
	componentWillMount(){
	  this.props.sdk.window.updateHeight();
	  this.props.sdk.window.startAutoResizer();
	  let initObj = this.props.sdk.field.getValue();
	  initObj.modal.shown = false;
	  //if this is a new page, there is no field value, so set to a default structure to avoid object errors
	  if(!initObj)initObj=initFormat;
	  this.setState(initObj)
	}
	
	onSortEnd = ({oldIndex, newIndex}) => {	  
		this.setState(({items}) => ({
	      items: arrayMove(items, oldIndex, newIndex),
	    }))
		this.props.sdk.field.setValue(this.state);
	};
  
  	handleAddItem=()=>{
		const {items} = this.state;//destructure, pull items object out
		const newId = 'item-'+[...Array(5)].map(_=>(Math.random()*36|0).toString(36)).join('');
		const newObj = {"id":newId	,"body":{"content":"","headline":"..."}}
		const AddState = [...items, newObj]//add new item to items object
		this.setState({items:AddState},this.handleEditModal({id:newObj.id, childIndex:(items.length), child:newObj}));

  	}
  	handleEdit=(props)=>{
	  	const {fieldChange,items, target} = {...this.state}
  		const updateTarget = update(
  			this.state,
  			{
		  		modal:{
			  		shown:{$set:false},
			  		},
		  		items:{
			  		[props.index]:
			  		{body:
				  		{
				  		content:{$set:target.body.content},
				  		headline:{$set:target.body.headline}
				  		}
				  	}
		  		}
	  		})
  		this.setState(updateTarget,()=>{this.clearAndSave(true)})
	}
	//TODO: combine this and handleRemoveModal, since both are just setting states
	handleEditModal=(props)=>{
		const modalSet = update(
			this.state,{
				modal:{
				  	shown:{$set:true},
				  	type:{$set:'edit'},
				  	title: {$set:"Edit Entry"},
				  	intent:{$set:"primary"},
				  	confirm:{$set:"Change Entry"},
			  	
			  	},
				target:{
					index:{$set:props.childIndex},
					id:{$set:props.id},
					body:{
						headline:{$set:props.child.body.headline},
						content:{$set:props.child.body.content}
					}
				}
			
		  	})
	  	this.setState(modalSet)		  	
	}
	handleFieldChange=(event, isModal)=>{
		const {name, value} = event.target
		if(isModal){
			const updates = update(this.state,{
				target:{
					body:{
						[name]:{$set:value}
					}
				}
			})
			this.setState(updates)
		}else{
			const updates = update(this.state,{
					overview:{
						[name]:{$set:value}
					}

			})
			this.setState(updates, ()=>{this.clearAndSave(true)})
		}
		
	}
	handleRTEchange=(value,isModal)=>{
		if(isModal){
			let target = {...this.state.target}
			const changed = update(this.state,{
				target:{
					body:{
						content:{
							$set:value
						}
					}
				}
			})
			this.setState(changed);
		}else{
			const changed = update(this.state,{
				overview:{
					content:{
						$set:value
					}
				}
			})
			this.setState(changed, ()=>this.clearAndSave(true))
		}
		
	}	
  	handleRemoveModal=(props)=>{
	  	const modalSet = update(this.state,{
		  	modal:{
			  	shown:{$set:true},
			  	type:{$set:'delete'},
			  	title: {$set:"Confirm Entry Removal"},
			  	intent:{$set:"negative"},
			  	confirm:{$set:"Confirm Entry Removal"},
			  	}, 
		  	target:{
			  	index:{$set:props.childIndex},
			  	id:{$set:''},
			  	body:{
				  	content:{$set:''},
				  	headline:{$set:''}
				  	}
			  	}
			 }
	  	)
	  	this.setState(modalSet)
	}	
  	handleRemove=(props)=>{
	  	const removal = update(this.state,{
	  		items:{$splice:[[props.index,1]]}	
	  		} )
	  	this.setState(removal,()=>{this.clearAndSave(true)})
	  	 	
  	} 	
  	onConfirm(props){
	  	if(this.state.modal.type==="delete"){
		  	
		  	this.handleRemove(props)
	  	}else{
		  	this.handleEdit(props)
	  	}
  	}
  	clearAndSave(save){
	  	const clear = update(this.state,{
		  	modal:{shown:{$set:false}},
		  	target:{
			  	id:{$set:''},
			  	index:{$set:''},
			  	body:{
				  	content:{$set:''},
				  	headline:{$set:''}
			  	}}
	  	})
	  	this.setState(clear)
	  	if(save===true)this.props.sdk.field.setValue(this.state)
  	}
  	//add alloy inline to textarea
  	renderSwitch(param) {
	  switch(param) {
	    case 'edit':
	  		return(
		  		<Form onSubmit={this.onHandleEdit}>
			  		<TextInput 
			  		name="headline" 
			  		id="headline" 
			  		value={this.state.target.body.headline||''}
			  		onChange={(e)=>this.handleFieldChange(e,true)}
			  		/>
			  		
			  		<ReactQuill 
			  		name="content" 
			  		value={this.state.target.body.content||''}
			  		onChange={(value)=>this.handleRTEchange(value,true)} 
			  		modules={this.modules}
			  		/>
			  		
		  		</Form>
		  		)
		break;
		case 'delete':
			return 'You are about to delete this entry.'
		break;
		default:
		break;	  
		}
	}
	 modules = {
		toolbar: [
			['bold', 'italic', {'script':'super'}],
	      [{'list': 'ordered'}, {'list': 'bullet'}],
	      ['clean']
		    ],
	  }
	btnShow = () => {
		const btnState = (this.state.items.length >= this.props.sdk.parameters.instance.maxSteps) ? "none" : "block";
		return btnState;
	}
  	render() {
	    return (
		    <>
		    <div className="overview">
		    <h3>Section Overview</h3>
			   <TextField
			   		className="overview-headline"
				    name="headline"
				    id="overview-headline"
				    labelText="Headline"
				    value={this.state.overview.headline || ''}
				    onChange={e=>this.handleFieldChange(e)}
				    textInputProps={{
				    	placeholder: "Main Content Headline",
				        maxLength: 50,
				    }}
			  	/>
			  	<label className="FormLabel__FormLabel___3d6zQ" data-test-id="cf-ui-form-label" htmlFor="overview-content">Introduction</label>
			  	<ReactQuill 
			  		name="overview-content" 
			  		value={this.state.overview.content||''}
			  		onChange={(value)=>this.handleRTEchange(value)} 
			  		modules={this.modules}
		  		/>
		  	</div>
		    <SortableList 
			    items={this.state.items} 
			    onSortEnd={this.onSortEnd} 
			    onAddItem={this.handleAddItem}
			    onEdit = {this.handleEditModal}
			    onRemove = {this.handleRemoveModal}
		    /> 
			<Button 
		      buttonType="naked" 
		      isFullWidth={true} 
		      icon="Plus" 
		      id="add-new-item"
		      onClick={this.handleAddItem}
		      style={{display: this.btnShow()}}
			  />
		    
		    <ModalConfirm
		        isShown={this.state.modal.shown||false}
		        size="fullWidth"
		        allowHeightOverflow={true}
		        title={this.state.modal.title||"Modal"}
		        intent={this.state.modal.intent||"positive"}
		        confirmLabel={this.state.modal.confirm||"Confirm"}
		        cancelLabel="Cancel" 										
		        onCancel={()=>{
			        this.clearAndSave(false)
			        }
		        }
		        onConfirm={() => {	
					this.onConfirm(this.state.target)
		        }}
		      >
      	        {this.renderSwitch(this.state.modal.type)}
      	        {this.props.children}
	      </ModalConfirm>
		 
	      </>
		);
	  }
}
init(sdk => {render(<MainContent sdk={sdk} />, document.getElementById('root'));});
