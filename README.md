# CrawlerNode

NodeJS实现的动态爬虫，用于触发所有请求，结合扫描器被动扫描

## URL处理流程
- [x] preparePage
   - [x] DOM构建前注入js hook
   - [x] setUA、开启请求拦截、开js、关缓存
- [x] hook 请求(导航锁定、图片等资源处理)
   - [x] 前端直接入queue
   - [x] 后端30x请求，跟首先判断page内容是否空，空就跟，非空就加queue，返回204
   - [x] 设置图片等资源返回
- [x] 收集链接
   - [x] src、href、action等
   - [ ] 注释中的url
- [ ] DOM构建后遍历节点，并触发节点中事件(包含对新节点的处理)
   - [ ] dom event
   - [x] inline event
- [x] 自动填表单submit
- [ ] url去重

## 异步高并发解决方案
cluster或者多进程，选择puppeteer-cluster

## 参考链接
https://www.anquanke.com/post/id/178339  
https://xz.aliyun.com/t/7064   
http://blog.fatezero.org/2018/04/09/web-scanner-crawler-02/  
https://juejin.im/post/5dca6f04f265da4d1a4ca293
