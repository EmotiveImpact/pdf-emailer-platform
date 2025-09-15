# Custom Domain Setup Guide: newwaterbill.com

This guide will help you set up the custom domain `newwaterbill.com` for your PDF Emailer Platform.

## ✅ Code Changes Complete

The following changes have been made to prepare your application for the custom domain:

### 📦 Package Configuration
- **Package name**: Updated to `newwaterbill-platform`
- **Email domain**: Changed to `@newwaterbill.com`
- **Sender name**: Updated to "New Water Bill"

### 🔧 Configuration Files Updated
- `package.json` - Project name updated
- `.env.local` - Email configuration updated
- `.env.example` - Default values updated
- `src/config/emailCredentials.ts` - Default email settings updated
- `vercel.json` - Domain configuration added

## 🌐 Next Steps: Domain Setup

### 1. Purchase and Configure Domain
1. **Purchase the domain** `newwaterbill.com` from a domain registrar (GoDaddy, Namecheap, etc.)
2. **Access your domain's DNS settings** through your registrar's control panel

### 2. Configure DNS Records
Add the following DNS records in your domain registrar:

#### For Vercel Deployment:
```
Type: A
Name: @
Value: 76.76.19.61
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### Alternative (if using Vercel's nameservers):
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. Add Domain to Vercel Project
1. **Go to your Vercel dashboard**: https://vercel.com/dashboard
2. **Select your project**: `pdf-emailer-platform`
3. **Go to Settings** → **Domains**
4. **Add domain**: `newwaterbill.com`
5. **Add www subdomain**: `www.newwaterbill.com`
6. **Follow Vercel's verification steps**

### 4. SSL Certificate
Vercel will automatically provision an SSL certificate for your custom domain once DNS is properly configured.

### 5. Email Configuration (Mailgun)
To use `statements@newwaterbill.com` for sending emails:

1. **Log into Mailgun**: https://mailgun.com
2. **Add your domain**: `newwaterbill.com`
3. **Verify domain ownership** by adding the required DNS records
4. **Update your environment variables** with the new Mailgun domain

#### Required Mailgun DNS Records:
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;

Type: CNAME
Name: email.newwaterbill.com
Value: mailgun.org

Type: MX
Name: @
Value: mxa.mailgun.org (Priority: 10)
Value: mxb.mailgun.org (Priority: 10)
```

### 6. Update Environment Variables
Once your Mailgun domain is verified, update your environment variables:

```bash
VITE_MAILGUN_DOMAIN=newwaterbill.com
VITE_FROM_EMAIL=statements@newwaterbill.com
VITE_FROM_NAME=New Water Bill
```

## 🚀 Deployment Status

Your application is ready for the custom domain! The code changes have been:
- ✅ Committed to your repository
- ✅ Pushed to GitHub
- ✅ Automatically deployed to Vercel

## 📋 Verification Checklist

After completing the DNS setup:

- [ ] Domain resolves to your application
- [ ] SSL certificate is active (https://)
- [ ] www.newwaterbill.com redirects properly
- [ ] Email sending works with new domain
- [ ] All application features work on new domain

## 🔍 Troubleshooting

### DNS Propagation
- DNS changes can take 24-48 hours to propagate globally
- Use tools like https://dnschecker.org to check propagation status

### Vercel Domain Issues
- Ensure DNS records point to Vercel's servers
- Check Vercel dashboard for domain verification status
- Contact Vercel support if verification fails

### Email Issues
- Verify Mailgun domain is properly configured
- Check that all required DNS records are added
- Test email sending after domain verification

## 📞 Support

If you encounter issues:
1. Check Vercel dashboard for domain status
2. Verify DNS records are correctly configured
3. Contact your domain registrar for DNS support
4. Contact Vercel support for deployment issues

---

**Current Status**: Code ready ✅ | DNS setup pending ⏳ | Domain verification pending ⏳
