import React, { useState, useEffect, useRef } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { api } from 'common';
import { makeStyles } from '@mui/styles';
import { useTranslation } from "react-i18next";
import {
  Modal,
  Grid,
  Typography
} from '@mui/material';
import Button from "components/CustomButtons/Button.js";
import CancelIcon from '@mui/icons-material/Cancel';
import AlertDialog from '../components/AlertDialog';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BlockIcon from '@mui/icons-material/Block';
import {colors} from '../components/Theme/WebTheme';
import moment from 'moment/min/moment-with-locales';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit3:{
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
  },
  paper: {
    width: 500,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    borderRadius:15,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default function CarsList() {
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const settings = useSelector(state => state.settingsdata.settings);
  const userdata = useSelector(state => state.usersdata);
  const auth = useSelector(state => state.auth);
  const [drivers,setDrivers] = useState([]);
  const {
    updateUserCar,
    editCar
  } = api;
  const [driversObj, setDriversObj] = useState();
  const [fleetMapObj, setFleetMapObj] = useState([]);
  const [data, setData] = useState([]);
  const cartypes = useSelector(state => state.cartypes);
  const carlistdata = useSelector(state => state.carlistdata);
  const dispatch = useDispatch();
  const rootRef = useRef(null);
  const classes = useStyles();
  const [cars, setCars] = useState({});
  const [role, setRole] = useState(null);
  
  useEffect(() => {
    if(role !== 'driver' && userdata.users){
        let arr =  userdata.users.filter(user => user.usertype==='driver' && ((role === 'fleetadmin' && user.fleetadmin && user.fleetadmin === auth.profile.uid) || role === 'admin'));
        let obj = {}; 
        let obj2 =  {};
        let arr2 = [];
        for(let i=0;i  < arr.length; i++){
            let user = arr[i];
            arr2.push({id: user.id, desc:user.firstName + ' ' + user.lastName + ' (' + (settings.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (settings.AllowCriticalEditsAdmin? user.email : "Hidden")});
            obj[user.id]=user.firstName + ' ' + user.lastName + ' (' + (settings.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (settings.AllowCriticalEditsAdmin? user.email : "Hidden");
            obj2[user.id]=user.fleetadmin?user.fleetadmin:null
        }
        setDrivers(arr2);
        setDriversObj(obj);
        setFleetMapObj(obj2);    
    } 
  }, [userdata.users,settings.AllowCriticalEditsAdmin,role,auth.profile.uid]);

  useEffect(()=>{
    if(cartypes.cars){
        let obj =  {};
        cartypes.cars.sort((a, b) => a.pos - b.pos).map((car)=> obj[car.name]=car.name)
        setCars(obj);
    }
  },[cartypes.cars]);

  useEffect(() => {
    if(auth.profile && auth.profile.usertype){
      setRole(auth.profile.usertype);
    }
  }, [auth.profile]);

  useEffect(() => {
    if (carlistdata.cars) {
      setData(carlistdata.cars)
    } else {
      setData([]);
    }
  }, [carlistdata.cars]);

  const [selectedImage, setSelectedImage] = useState(null); 
  const handleProfileModal = (e) => {
    setProfileModal(false);
    setSelectedImage(null);
  }

  const [userData, setUserData] = useState();
  const [profileModal, setProfileModal] =  useState(false);
  const [imageData, setImageData] =  useState(false);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [loading, setLoading] = useState(false);

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  const handleSetProfileModal = (e) =>{
    e.preventDefault();
    if(selectedImage){
      setLoading(true);
      let finalData = userData;
      finalData.car_image = selectedImage;
      dispatch(editCar(finalData, "UpdateImage"));
      setProfileModal(false); 
      setTimeout(()=>{
        setSelectedImage(null);
        setLoading(false); 
      },10000);
    }
    else{
      setCommonAlert({ open: true, msg: t('choose_image_first') })
    }
  }

  const onClick = (rowData) => {
    setImageData(rowData.car_image);
    setProfileModal(true);
    setUserData(rowData);
  };
  
  const columns = [
    { title: t('createdAt'), field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt? moment(rowData.createdAt).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
    { title: t('driver'), field: 'driver', editable: role === 'driver'? 'never': 'always', cellStyle:{ textAlign: 'center'}, 
      render: rowData =>{
        if (rowData && rowData.driver) {
          return driversObj && driversObj[rowData.driver]?driversObj[rowData.driver]: null
        }
      },
      editComponent: props => (
        <Autocomplete
          id="combo-box-demo"
          options={drivers}
          getOptionLabel={(option) => option.desc}
          style={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Combo box" variant="outlined" />}
          onChange={(event, newValue) => {
            props.onChange(newValue.id)
          }}
        />
      ),
      exportTransformer: (rowData) => driversObj[rowData.driver],
      hidden: role === 'driver'? true: false,
    },
    { title: t('car_type'), field: 'carType',lookup: cars},
    { title: t('vehicle_reg_no'), field: 'vehicleNumber'},
    { title: t('vehicle_model_name'), field: 'vehicleMake'},
    { title: t('vehicle_model_no'),  field: 'vehicleModel'},
    { title: t('other_info'),  field: 'other_info'},
    { title: t('image'),  field: 'car_image',
        initialEditValue: 'https://cdn.pixabay.com/photo/2012/04/13/20/37/car-33556__480.png',
        render: rowData => rowData.car_image? <button onClick={()=>{onClick(rowData)}}><img alt='CarImage' src={rowData.car_image} style={{width: 50}}/></button>:null
    },
    { title: t('active_status'), field: 'active', editable: role === 'admin' ? 'never': 'always', type:'boolean'},
    { title: t('approved'), field: 'approved', editable:'never', type:'boolean'}
  ];

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    carlistdata.loading ? <CircularLoading /> :
    <div ref={rootRef}>
      <MaterialTable
        title={t('cars')}
        columns={columns}
        style={{direction:isRTL ==='rtl'?'rtl':'ltr', borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
        data={data}
        onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
        options={{
          exportButton: true,
          rowStyle: rowData => ({
            backgroundColor: (selectedRow === rowData.tableData.id) ? '#EEE' : '#FFF'
          }),
          editable:{
            backgroundColor: colors.Header_Text,
            fontSize: "0.8em",
            fontWeight: 'bold ',
            fontFamily: 'Lucida Console", "Courier New", monospace'
          },
          headerStyle: {
            position: "sticky",
            top: "0px",
            backgroundColor: colors.Header_Text_back ,
            color: '#fff',
            fontSize: "0.8em",
            fontWeight: 'bold ',
            fontFamily: 'Lucida Console", "Courier New", monospace'
          },
        }}
        localization={{body:{
          addTooltip: (t('add')),
          deleteTooltip: (t('delete')),
          editTooltip: (t('edit')),
          emptyDataSourceMessage: (
            (t('blank_message'))
        ),
        editRow: { 
          deleteText: (t('delete_message')),
          cancelTooltip: (t('cancel')),
          saveTooltip: (t('save')) 
           }, 
          },
          toolbar: {
            searchPlaceholder: (t('search')),
            exportTitle: (t('export')),
          },
          header: {
            actions: (t('actions')) 
        },
        pagination: {
          labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
          firstTooltip: (t('first_page_tooltip')),
          previousTooltip: (t('previous_page_tooltip')),
          nextTooltip: (t('next_page_tooltip')),
          lastTooltip: (t('last_page_tooltip'))
        },
        }}
        editable={{
          onRowAdd: newData =>
          settings.AllowCriticalEditsAdmin?
            new Promise((resolve, reject) => {
              setTimeout(() => {
                if(newData && newData.carType && newData.vehicleNumber && newData.vehicleMake && newData.vehicleModel && newData.other_info && newData.car_image){
                  let selectDriver = role === 'admin'? newData.driver : auth.profile.uid;
                  let activeCar = null;
                  let updateData = { 
                    carType: newData.carType,
                    vehicleNumber: newData.vehicleNumber,
                    vehicleMake: newData.vehicleMake,
                    vehicleModel: newData.vehicleModel,
                    other_info: newData.other_info,
                    car_image: newData.car_image,
                    updateAt: new Date().getTime()
                  }
                  for(let i=0;i<data.length;i++){
                    if(data[i].driver === newData.driver && data[i].active){
                        activeCar = data[i];
                        break;
                    }
                  }
                  if(activeCar && newData.active){
                    activeCar.active = false;
                    dispatch(editCar(activeCar,"Update"));
                    dispatch(updateUserCar(selectDriver,updateData));
                  } else if(activeCar && !newData.active){
                    newData.active = false;           
                  }else {
                    newData.active = true;
                    dispatch(updateUserCar(selectDriver,updateData));
                  }
                  if(role === 'driver'){
                    newData['driver'] = selectDriver;
                  }
                  newData['createdAt'] = new Date().getTime();
                  newData['fleetadmin'] = newData['driver']? (fleetMapObj[newData['driver']]?fleetMapObj[newData['driver']]: null): null;
                  if(!settings.carApproval){
                    newData['approved'] = true;
                    if(newData.active){
                      dispatch(updateUserCar(newData.driver,{carApproved: true}));
                    }
                  } else {
                    newData['approved'] = false;
                  }
                  dispatch(editCar(newData,"Add"));
                  resolve();
                } else{
                  alert(t('proper_input_name'));
                  reject();
                }
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            }),
          onRowUpdate: (newData, oldData) =>
            settings.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                if(newData !== oldData){
                  let activeCar = null;
                  let updateData = { 
                    carType: newData.carType,
                    vehicleNumber: newData.vehicleNumber,
                    vehicleMake: newData.vehicleMake,
                    vehicleModel: newData.vehicleModel,
                    other_info: newData.other_info,
                    car_image: newData.car_image,
                    updateAt: new Date().getTime()
                  }
                  for(let i=0;i<data.length;i++){
                    if(data[i].driver === newData.driver && data[i].active){
                        activeCar = data[i];
                        break;
                    }
                  }
                  if(activeCar && newData.active){
                    activeCar.active = false;
                    dispatch(editCar(activeCar,"Update"));
                    dispatch(updateUserCar(newData.driver,updateData));
                  } else if(activeCar && !newData.active){
                    newData.active = false;           
                  }else {
                    newData.active = true;
                    dispatch(updateUserCar(newData.driver,updateData));
                  }
                  newData['fleetadmin'] = newData['fleetadmin']? fleetMapObj[newData['driver']]:null;
                  delete newData.tableData;
                  dispatch(editCar(newData,"Update"));
                  if(newData.driver !== oldData.driver && oldData.driver){
                    dispatch(updateUserCar(oldData.driver,
                      { 
                        carType: null,
                        vehicleNumber: null,
                        vehicleMake: null,
                        vehicleModel: null,
                        other_info: null,
                        car_image: null,
                        updateAt: new Date().getTime()
                      }));
                  }
                }
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            }),
          onRowDelete: oldData =>
            settings.AllowCriticalEditsAdmin?
            new Promise((resolve, reject) => {
              setTimeout(() => {
                if(oldData.active){
                    reject();
                    alert(t('active_car_delete'));
                } else {
                    resolve();
                    dispatch(editCar(oldData,"Delete"));
                }
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            })
        }}
        actions={[
          rowData => (settings.carApproval && role === 'admin' ?{
            icon: () => 
              rowData.approved? 
                <div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
                  <BlockIcon />
                  <Typography variant="subtitle2">{t('reject')}</Typography>
                </div>
                :
                <div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
                  <DoneAllIcon />
                  <Typography variant="subtitle2">{t('accept')}</Typography>
                </div>
            ,
            onClick: (event, rowData) => {
              if(rowData.active){
                  dispatch(updateUserCar(rowData.driver,{carApproved: !rowData.approved}));
              }
              dispatch(editCar({...rowData, approved: !rowData.approved},"Update"));  
            }
          }:null),
        ]}
      />
      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={profileModal}
        onClose={handleProfileModal}
        className={classes.modal}
        container={() => rootRef.current}
      >
      <Grid container spacing={1} className={classes.paper} style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
        <Grid item xs={12} sm={12} md={12} lg={12}>
            <Typography component="h1" variant="h6">
                {t('car_image')}
              <input
                  type="file"
                  style={{marginLeft:10}}
                  name= {t('image')}
                  onChange={(event) => {
                      setSelectedImage(event.target.files[0]);
                  }}
              />
            </Typography>
         </Grid>
         <Grid item xs={12} sm={12} md={12} lg={12}>
                  {selectedImage  && !loading ? 
                    <Tooltip title={t('cancel')}>
                      <CancelIcon onClick={()=>setSelectedImage(null)} style={{ fontSize: 30,backgroundColor:'red',borderRadius:50,color:"white" }}  />
                    </Tooltip>
                  : null }
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  {selectedImage ? 
                   <img alt="not fount" width={"200px"} height={"200px"}  src={URL.createObjectURL(selectedImage)} style={{marginTop:15,marginBottom:20}}/>
                   :
                    <img alt="not fount" width={"200px"} height={"200px"}  src={imageData} style={{marginTop:10}}/>
                  }
                <br />
                </Grid>

          <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
          {loading ? 
            <Grid
              container
              spacing={0}
              alignItems="center"
              justify="center"
              style={{ minHeight: '5vh' }} >
              <CircularProgress/>
            </Grid>
            :
            <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
            <Button onClick={handleProfileModal} variant="contained" color="danger">
              {t('cancel')}
            </Button>
            <Button onClick={handleSetProfileModal} variant="contained" color="secondaryButton" style={{marginLeft:10}}>
              {t('save')}
            </Button>
            </Grid>
          }
          </Grid>
        </Grid>
      </Modal>
      <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
    </div>
  );
}
