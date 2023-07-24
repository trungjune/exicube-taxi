import React from "react";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import HeaderLinks from "components/Header/HeaderLinks.js";
import styles from '../styles/staticPages.js';
import Parallax from "components/Parallax/Parallax";
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import { useSelector } from "react-redux";
import ListItem from "@mui/material/ListItem";
import IconButton from '@mui/material/IconButton';
const dashboardRoutes = [];

const useStyles = makeStyles(styles);

export default function ContactUs(props) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir();
    const classes = useStyles();
    const { ...rest } = props;
    const settings = useSelector(state => state.settingsdata.settings);
    return (
        <div style={{margin:'-8px'}}>
            <Header
                color="transparent"
                routes={dashboardRoutes}
                rightLinks={<HeaderLinks />}
                fixed
                changeColorOnScroll={{
                    height: 400,
                    color: "white"
                }}
                {...rest}
            />
            <Parallax small filter image={require("assets/img/header-back.jpg").default} />
            <div className={classNames(classes.main, classes.mainRaised)}>

                <div className={classes.container}>
                    <br />
                    <h2 style={{ textAlign: isRTL === 'rtl' ? 'right' : 'left', position: "relative", marginTop: "30px", minHeight: "32px", color: "#383838", textDecoration: "none" }}>{t('contact_us')}</h2>
                    <p className={classes.description} style={{ textAlign: isRTL === 'rtl' ? 'right' : 'left', color: 'black', fontSize: 20, fontWeight: 'bold',marginTop:30 }}>{settings.CompanyName}</p>
                    <p className={classes.description} style={{ textAlign: isRTL === 'rtl' ? 'right' : 'left', color: 'black', fontSize: 16 }}>{settings.CompanyAddress}</p>
                    {settings && settings.contact_email ?
                        <p><span className={classes.description}>{t('email')}: </span>
                            <a href={"mailto:" + settings.contact_email} className={classes.description}>{settings.contact_email}</a>
                        </p>
                        : null}
                    {settings && settings.CompanyPhone ?
                        <p className={classes.description}>{t('phone')}: {settings.CompanyPhone}</p>
                        : null}
                    <p className={classes.description} style={{ textAlign: isRTL === 'rtl' ? 'right' : 'left', color: 'black', marginTop: 10 }}>Follow Us</p>
                    <div style={{ display: 'flex', width: 40, marginTop: -15,marginLeft:-27}}>
                        {settings && settings.FacebookHandle ?
                            <ListItem className={classes.listItem}>
                                <Tooltip
                                    id="instagram-facebook"
                                    title={t('follow_facebook')}
                                    placement={window.innerWidth > 959 ? "top" : "left"}
                                    classes={{ tooltip: classes.tooltip }}
                                >
                                    <IconButton 
                                        href={settings.FacebookHandle}
                                        target="_blank"
                                        className={classes.navLink}
                                        style={{color:'#3b5998'}}
                                    >
                                        <i className={classes.socialIcons + " fab fa-facebook"}/>
                                    </IconButton>
                                </Tooltip>
                            </ListItem>
                            : null}
                        {settings && settings.TwitterHandle ?
                            <ListItem className={classes.listItem}>
                                <Tooltip
                                    id="instagram-twitter"
                                    title={t('follow_twitter')}
                                    placement={window.innerWidth > 959 ? "top" : "left"}
                                    classes={{ tooltip: classes.tooltip }}
                                >
                                    <IconButton
                                        href={settings.TwitterHandle}
                                        target="_blank"
                                        className={classes.navLink}
                                        style={{color:'#00acee'}}
                                    >
                                        <i className={classes.socialIcons + " fab fa-twitter"} />
                                    </IconButton>
                                </Tooltip>
                            </ListItem>
                            : null}
                             {settings && settings.InstagramHandle ?
                            <ListItem className={classes.listItem}>
                                <Tooltip
                                    id="instagram-twitter"
                                    title={t('follow_instagram')}
                                    placement={window.innerWidth > 959 ? "top" : "left"}
                                    classes={{ tooltip: classes.tooltip }}
                                >
                                    <IconButton
                                        href={settings.InstagramHandle}
                                        target="_blank"
                                        className={classes.navLink}
                                        style={{color:'#833AB4'}}
                                    >
                                        <i className={classes.socialIcons + " fab fa-instagram"} />
                                    </IconButton>
                                </Tooltip>
                            </ListItem>
                        : null }
                    </div>
                    <br />
                </div>
            </div>

            <Footer />
        </div>
    );
}