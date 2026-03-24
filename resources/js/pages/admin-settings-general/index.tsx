"use client"

import React, { useState } from "react"
import AdminSettingsLayout from "@/layouts/admin-settings/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const GeneralSettings = () => {
    // Form state
    const [applicationName, setApplicationName] = useState("NextGRC")
    const [description, setDescription] = useState("")
    const [loginBannerImage, setLoginBannerImage] = useState("")
    const [ldapEnabled, setLdapEnabled] = useState(false)
    const [ldapServer, setLdapServer] = useState("")
    const [ldapPort, setLdapPort] = useState("389")
    const [ldapBaseDn, setLdapBaseDn] = useState("")
    const [ldapBindDn, setLdapBindDn] = useState("")
    const [ldapBindPassword, setLdapBindPassword] = useState("")
    const [smtpHost, setSmtpHost] = useState("")
    const [smtpPort, setSmtpPort] = useState("587")
    const [smtpUsername, setSmtpUsername] = useState("")
    const [smtpPassword, setSmtpPassword] = useState("")
    const [smtpFromEmail, setSmtpFromEmail] = useState("")
    const [smtpFromName, setSmtpFromName] = useState("")
    const [smtpEncryption, setSmtpEncryption] = useState("tls")
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        
        // TODO: Implement API call to save settings
        setTimeout(() => {
            setIsSaving(false)
            // Show success notification
        }, 1000)
    }

    const handleReset = () => {
        setApplicationName("NextGRC")
        setDescription("")
        setLoginBannerImage("")
        setLdapEnabled(false)
        setLdapServer("")
        setLdapPort("389")
        setLdapBaseDn("")
        setLdapBindDn("")
        setLdapBindPassword("")
        setSmtpHost("")
        setSmtpPort("587")
        setSmtpUsername("")
        setSmtpPassword("")
        setSmtpFromEmail("")
        setSmtpFromName("")
        setSmtpEncryption("tls")
    }

    return (
        <AdminSettingsLayout title="General Settings">
            <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 space-y-1 sm:mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        General Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your project configuration and preferences
                    </p>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Settings</CardTitle>
                            <CardDescription>
                                Configure general application settings and preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveSettings} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="applicationName">
                                        Application Name
                                    </Label>
                                    <Input
                                        id="applicationName"
                                        type="text"
                                        value={applicationName}
                                        onChange={(e) => setApplicationName(e.target.value)}
                                        placeholder="Enter application name"
                                        className="max-w-md"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        The name displayed throughout the application
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Enter application description"
                                        className="max-w-2xl"
                                        rows={3}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        A brief description of your application or organization
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="loginBannerImage">
                                        Login Banner Image URL
                                    </Label>
                                    <Input
                                        id="loginBannerImage"
                                        type="url"
                                        value={loginBannerImage}
                                        onChange={(e) => setLoginBannerImage(e.target.value)}
                                        placeholder="https://example.com/banner.jpg"
                                        className="max-w-md"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Image displayed on the login page banner
                                    </p>
                                </div>

                                <div className="space-y-4 rounded-lg border border-border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="ldapEnabled" className="text-base">
                                                LDAP Integration
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enable LDAP authentication for user login
                                            </p>
                                        </div>
                                        <Switch
                                            id="ldapEnabled"
                                            checked={ldapEnabled}
                                            onCheckedChange={setLdapEnabled}
                                        />
                                    </div>

                                    {ldapEnabled && (
                                        <div className="space-y-4 border-t border-border pt-4">
                                            <h4 className="text-sm font-medium">LDAP Configuration</h4>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ldapServer">
                                                        LDAP Server
                                                    </Label>
                                                    <Input
                                                        id="ldapServer"
                                                        type="text"
                                                        value={ldapServer}
                                                        onChange={(e) => setLdapServer(e.target.value)}
                                                        placeholder="ldap.example.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ldapPort">
                                                        Port
                                                    </Label>
                                                    <Input
                                                        id="ldapPort"
                                                        type="text"
                                                        value={ldapPort}
                                                        onChange={(e) => setLdapPort(e.target.value)}
                                                        placeholder="389"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ldapBaseDn">
                                                    Base DN
                                                </Label>
                                                <Input
                                                    id="ldapBaseDn"
                                                    type="text"
                                                    value={ldapBaseDn}
                                                    onChange={(e) => setLdapBaseDn(e.target.value)}
                                                    placeholder="dc=example,dc=com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ldapBindDn">
                                                    Bind DN
                                                </Label>
                                                <Input
                                                    id="ldapBindDn"
                                                    type="text"
                                                    value={ldapBindDn}
                                                    onChange={(e) => setLdapBindDn(e.target.value)}
                                                    placeholder="cn=admin,dc=example,dc=com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ldapBindPassword">
                                                    Bind Password
                                                </Label>
                                                <Input
                                                    id="ldapBindPassword"
                                                    type="password"
                                                    value={ldapBindPassword}
                                                    onChange={(e) => setLdapBindPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 rounded-lg border border-border p-4">
                                    <h4 className="text-base font-medium">SMTP Configuration</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Configure email server settings for sending notifications
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpHost">
                                                SMTP Host
                                            </Label>
                                            <Input
                                                id="smtpHost"
                                                type="text"
                                                value={smtpHost}
                                                onChange={(e) => setSmtpHost(e.target.value)}
                                                placeholder="smtp.example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPort">
                                                Port
                                            </Label>
                                            <Input
                                                id="smtpPort"
                                                type="text"
                                                value={smtpPort}
                                                onChange={(e) => setSmtpPort(e.target.value)}
                                                placeholder="587"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpUsername">
                                                Username
                                            </Label>
                                            <Input
                                                id="smtpUsername"
                                                type="text"
                                                value={smtpUsername}
                                                onChange={(e) => setSmtpUsername(e.target.value)}
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPassword">
                                                Password
                                            </Label>
                                            <Input
                                                id="smtpPassword"
                                                type="password"
                                                value={smtpPassword}
                                                onChange={(e) => setSmtpPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpFromEmail">
                                                From Email
                                            </Label>
                                            <Input
                                                id="smtpFromEmail"
                                                type="email"
                                                value={smtpFromEmail}
                                                onChange={(e) => setSmtpFromEmail(e.target.value)}
                                                placeholder="noreply@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpFromName">
                                                From Name
                                            </Label>
                                            <Input
                                                id="smtpFromName"
                                                type="text"
                                                value={smtpFromName}
                                                onChange={(e) => setSmtpFromName(e.target.value)}
                                                placeholder="NextGRC"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtpEncryption">
                                            Encryption
                                        </Label>
                                        <Input
                                            id="smtpEncryption"
                                            type="text"
                                            value={smtpEncryption}
                                            onChange={(e) => setSmtpEncryption(e.target.value)}
                                            placeholder="tls"
                                            className="max-w-xs"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Encryption method: tls, ssl, or none
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminSettingsLayout>
    )
}

export default GeneralSettings
