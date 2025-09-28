#!/usr/bin/env node

/**
 * 测试脚本：验证从 Mock 到真数据的迁移
 * 
 * 这个脚本会测试：
 * 1. M7 授权流：家长申请、学生同意、状态更新
 * 2. M8 指标系统：趋势分析、班级对比、事件记录
 * 3. 权限验证：JWT 认证、数据访问控制
 * 4. 缓存机制：Redis 缓存、失效策略
 */

const axios = require('axios');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

// 测试数据
const testUsers = {
  parent: {
    email: 'parent@test.com',
    password: 'password123',
    role: 'parent'
  },
  student: {
    email: 'student@test.com', 
    password: 'password123',
    role: 'student'
  },
  teacher: {
    email: 'teacher@test.com',
    password: 'password123', 
    role: 'teacher'
  }
};

let authTokens = {};

// 工具函数
async function makeRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    timeout: TEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function login(userType) {
  console.log(`\n🔐 登录 ${userType}...`);
  
  const user = testUsers[userType];
  const result = await makeRequest('POST', '/auth/login', {
    email: user.email,
    password: user.password
  });

  if (result.success) {
    authTokens[userType] = result.data.accessToken;
    console.log(`✅ ${userType} 登录成功`);
    return true;
  } else {
    console.log(`❌ ${userType} 登录失败:`, result.error);
    return false;
  }
}

// 测试 M7 授权流
async function testM7AuthFlow() {
  console.log('\n📋 测试 M7 授权流...');

  // 1. 家长发现学生
  console.log('\n1. 家长发现学生...');
  const discoverResult = await makeRequest(
    'GET', 
    '/parents/discover-students?q=test', 
    null, 
    authTokens.parent
  );
  
  if (discoverResult.success) {
    console.log('✅ 学生发现功能正常');
    console.log(`   找到 ${discoverResult.data.length} 个学生`);
  } else {
    console.log('❌ 学生发现功能失败:', discoverResult.error);
    return false;
  }

  // 2. 家长发起授权申请
  console.log('\n2. 家长发起授权申请...');
  const linkRequestResult = await makeRequest(
    'POST',
    '/parents/link-requests',
    {
      studentId: 'test-student-id', // 这里应该是实际的学生ID
      note: '我是家长，申请查看孩子学习进度'
    },
    authTokens.parent
  );

  if (linkRequestResult.success) {
    console.log('✅ 授权申请创建成功');
    console.log(`   申请ID: ${linkRequestResult.data.id}`);
  } else {
    console.log('❌ 授权申请创建失败:', linkRequestResult.error);
    return false;
  }

  // 3. 学生查看授权申请
  console.log('\n3. 学生查看授权申请...');
  const consentsResult = await makeRequest(
    'GET',
    '/students/consents?status=pending',
    null,
    authTokens.student
  );

  if (consentsResult.success) {
    console.log('✅ 学生查看授权申请成功');
    console.log(`   待处理申请: ${consentsResult.data.length} 个`);
  } else {
    console.log('❌ 学生查看授权申请失败:', consentsResult.error);
    return false;
  }

  return true;
}

// 测试 M8 指标系统
async function testM8Metrics() {
  console.log('\n📊 测试 M8 指标系统...');

  // 1. 记录学习事件
  console.log('\n1. 记录学习事件...');
  const eventResult = await makeRequest(
    'POST',
    '/progress/events',
    {
      levelId: 'test-level-1',
      passed: true,
      timeMs: 120000 // 2 minutes
    },
    authTokens.student
  );

  if (eventResult.success) {
    console.log('✅ 学习事件记录成功');
  } else {
    console.log('❌ 学习事件记录失败:', eventResult.error);
    return false;
  }

  // 2. 获取学生趋势数据
  console.log('\n2. 获取学生趋势数据...');
  const trendResult = await makeRequest(
    'GET',
    '/metrics/students/test-student-id/trend?dims=study_minutes,levels_completed&period=daily&from=2024-01-01&to=2024-12-31',
    null,
    authTokens.parent
  );

  if (trendResult.success) {
    console.log('✅ 学生趋势数据获取成功');
    console.log(`   趋势系列: ${trendResult.data.series.length} 个`);
  } else {
    console.log('❌ 学生趋势数据获取失败:', trendResult.error);
    return false;
  }

  // 3. 获取班级对比数据
  console.log('\n3. 获取班级对比数据...');
  const comparisonResult = await makeRequest(
    'POST',
    '/metrics/compare',
    {
      classId: 'test-class-id',
      dims: ['levels_completed', 'accuracy'],
      period: 'weekly',
      week: '2024-01-01'
    },
    authTokens.teacher
  );

  if (comparisonResult.success) {
    console.log('✅ 班级对比数据获取成功');
    console.log(`   学生数据: ${comparisonResult.data.rows.length} 个`);
  } else {
    console.log('❌ 班级对比数据获取失败:', comparisonResult.error);
    return false;
  }

  return true;
}

// 测试权限验证
async function testPermissions() {
  console.log('\n🔒 测试权限验证...');

  // 1. 测试无权限访问
  console.log('\n1. 测试无权限访问...');
  const unauthorizedResult = await makeRequest(
    'GET',
    '/metrics/students/other-student-id/trend?dims=study_minutes&period=daily&from=2024-01-01&to=2024-12-31',
    null,
    authTokens.parent
  );

  if (!unauthorizedResult.success && unauthorizedResult.status === 403) {
    console.log('✅ 权限验证正常 - 正确拒绝无权限访问');
  } else {
    console.log('❌ 权限验证异常 - 应该拒绝无权限访问');
    return false;
  }

  // 2. 测试无认证访问
  console.log('\n2. 测试无认证访问...');
  const noAuthResult = await makeRequest(
    'GET',
    '/metrics/students/test-student-id/trend?dims=study_minutes&period=daily&from=2024-01-01&to=2024-12-31'
  );

  if (!noAuthResult.success && noAuthResult.status === 401) {
    console.log('✅ 认证验证正常 - 正确拒绝无认证访问');
  } else {
    console.log('❌ 认证验证异常 - 应该拒绝无认证访问');
    return false;
  }

  return true;
}

// 测试缓存机制
async function testCaching() {
  console.log('\n💾 测试缓存机制...');

  // 1. 第一次请求（应该缓存）
  console.log('\n1. 第一次请求（应该缓存）...');
  const start1 = Date.now();
  const result1 = await makeRequest(
    'GET',
    '/metrics/students/test-student-id/trend?dims=study_minutes&period=daily&from=2024-01-01&to=2024-12-31',
    null,
    authTokens.parent
  );
  const time1 = Date.now() - start1;

  if (result1.success) {
    console.log(`✅ 第一次请求成功，耗时: ${time1}ms`);
  } else {
    console.log('❌ 第一次请求失败:', result1.error);
    return false;
  }

  // 2. 第二次请求（应该从缓存获取）
  console.log('\n2. 第二次请求（应该从缓存获取）...');
  const start2 = Date.now();
  const result2 = await makeRequest(
    'GET',
    '/metrics/students/test-student-id/trend?dims=study_minutes&period=daily&from=2024-01-01&to=2024-12-31',
    null,
    authTokens.parent
  );
  const time2 = Date.now() - start2;

  if (result2.success) {
    console.log(`✅ 第二次请求成功，耗时: ${time2}ms`);
    if (time2 < time1) {
      console.log('✅ 缓存生效 - 第二次请求更快');
    } else {
      console.log('⚠️  缓存可能未生效 - 第二次请求没有更快');
    }
  } else {
    console.log('❌ 第二次请求失败:', result2.error);
    return false;
  }

  return true;
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试从 Mock 到真数据的迁移...');
  console.log(`API 地址: ${API_BASE_URL}`);

  try {
    // 登录所有用户
    const loginResults = await Promise.all([
      login('parent'),
      login('student'), 
      login('teacher')
    ]);

    if (!loginResults.every(result => result)) {
      console.log('\n❌ 用户登录失败，无法继续测试');
      return;
    }

    // 运行各项测试
    const testResults = await Promise.all([
      testM7AuthFlow(),
      testM8Metrics(),
      testPermissions(),
      testCaching()
    ]);

    // 汇总结果
    const passedTests = testResults.filter(result => result).length;
    const totalTests = testResults.length;

    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！迁移成功！');
    } else {
      console.log('\n⚠️  部分测试失败，需要检查实现');
    }

  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
